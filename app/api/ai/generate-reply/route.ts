import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    console.log('API call: /api/ai/generate-reply')

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.error('Error: GEMINI_API_KEY is not set')
        return NextResponse.json(
            { error: 'API Key not configuration' },
            { status: 500 }
        )
    }

    try {
        const { reviewText, rating, tone, reviewerName } = await request.json()
        console.log('Request params:', { rating, tone, reviewerName, textLength: reviewText?.length })

        // トーンの定義
        const tonePrompts = {
            grateful: '感謝の気持ちを込めた丁寧な返信',
            apologetic: '謝罪と改善の意思を示す誠実な返信',
        }
        const selectedTonePrompt = tonePrompts[tone as keyof typeof tonePrompts] || tonePrompts.grateful

        // レビュアー名が空の場合のフォールバック
        const nameInstruction = reviewerName
            ? `- 「${reviewerName} 様」から書き始めること`
            : '- 冒頭に「お客様」または適切な呼びかけを入れること（名前が不明なため）';

        const displayReviewerName = reviewerName || '(名前なし)';

        const promptText = `
あなたは店舗オーナーです。以下のGoogleビジネスプロフィールのクチコミに対して、${selectedTonePrompt}を日本語で生成してください。

【クチコミ内容】
投稿者名: ${displayReviewerName}
評価: ${rating}つ星
コメント: ${reviewText}

【返信の条件】
${nameInstruction}
- 150文字以内
- ${selectedTonePrompt}
- 具体的で心のこもった内容
- 絵文字は一切使用しない
`

        // 1. 利用可能なモデル一覧を取得
        const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        console.log('Fetching available models from:', listModelsUrl)

        // デフォルトモデル
        let targetModel = 'models/gemini-1.5-flash';

        try {
            const modelsResp = await fetch(listModelsUrl)
            if (modelsResp.ok) {
                const modelsData = await modelsResp.json()
                const availableModels = modelsData.models || []

                const modelNames = availableModels.map((m: any) => m.name)
                console.log('Available models:', modelNames)

                // 優先度: gemini-1.5-flash系 > gemini-flash系 > gemini-1.5-pro系 > その他
                // 注意: APIから返る名前は 'models/' プレフィックス付き
                const preferredOrder = [
                    'gemini-1.5-flash',
                    'gemini-flash',
                    'gemini-1.5-pro',
                    'gemini-1.0-pro'
                ]

                let foundModel = null

                // 優先順位リストに基づいて探す
                for (const pref of preferredOrder) {
                    foundModel = availableModels.find((m: any) =>
                        m.name.includes(pref) &&
                        m.supportedGenerationMethods?.includes('generateContent')
                    )
                    if (foundModel) break
                }

                // 見つからなければ、generateContentをサポートする任意のモデルを使う
                if (!foundModel) {
                    foundModel = availableModels.find((m: any) =>
                        m.supportedGenerationMethods?.includes('generateContent')
                    )
                }

                if (foundModel) {
                    targetModel = foundModel.name
                    console.log('Selected model:', targetModel)
                } else {
                    console.warn('No suitable model found in list, using default.')
                }
            } else {
                console.warn('Failed to list models status:', modelsResp.status)
            }
        } catch (e) {
            console.warn('Error listing models:', e)
        }

        // 2. 選択したモデルで生成
        // targetModelには既に 'models/' プレフィックスが含まれている場合が多いので、URL構築時に注意
        const modelResourceName = targetModel.startsWith('models/') ? targetModel : `models/${targetModel}`
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelResourceName}:generateContent?key=${apiKey}`

        console.log(`Generatig content with ${modelResourceName}...`)

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: promptText }]
                    }
                ]
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Gemini API Error:', JSON.stringify(errorData, null, 2))

            let errorMessage = errorData.error?.message || response.statusText

            // 429エラー（制限超過）の場合の親切なメッセージ
            if (response.status === 429) {
                errorMessage = 'API利用制限（クォータ超過）に達しました。しばらく時間をおいてから再度お試しください。'
            } else if (response.status === 404) {
                errorMessage = '指定されたAIモデルが利用できませんでした。別のモデルを使用するよう調整しましたので、再試行してください。'
            }

            throw new Error(errorMessage)
        }

        const data = await response.json()
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!reply) {
            console.error('Unexpected API response format:', JSON.stringify(data, null, 2))
            throw new Error('No reply generated')
        }

        console.log('Generation success, reply length:', reply.length)
        return NextResponse.json({ reply })
    } catch (error: any) {
        console.error('AI generation error detailed:', error)

        // エラーメッセージをクライアントに返す
        return NextResponse.json(
            { error: error.message || 'AI返信の生成に失敗しました' },
            { status: 500 }
        )
    }
}
