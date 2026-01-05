import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    console.log('API call: /api/ai/generate-review')

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        return NextResponse.json(
            { error: 'API Key not configuration' },
            { status: 500 }
        )
    }

    try {
        const {
            visitCount,
            visitTime,
            visitScene,
            rating,
            foodRating,
            serviceRating,
            atmosphereRating,
            costRating,
            bestPoint,
            comment
        } = await request.json()

        const promptText = `
あなたはプロのコピーライターです。
以下の詳細なアンケート結果を元に、Googleビジネスプロフィールに投稿するための自然で好意的な口コミ文を生成してください。
ユーザー（顧客）になりきって、実体験に基づいた感想として書いてください。

【アンケート結果】
- 来店回数: ${visitCount}
- 来店日時: ${visitTime}
- 利用シーン: ${visitScene}
- 総合評価: ${rating}/5
- 料理・ドリンク: ${foodRating}/5
- 接客・サービス: ${serviceRating}/5
- 雰囲気: ${atmosphereRating}/5
- コスパ: ${costRating}/5
- 一番良かった点: ${bestPoint || '特になし'}
- ご意見・ご感想: ${comment || '特になし'}

【条件】
- 自然な日本語（丁寧語・ですます調）であること
- 絵文字は一切使用しないこと
- 堅苦しすぎず、かつ失礼のない適度な丁寧さを保つこと
- 200文字〜300文字程度
- 具体的な評価項目（料理、接客、雰囲気など）に触れること
- 「一番良かった点」は必ず強調して書くこと
- 総合評価が高い場合は、他の人にもおすすめするような結びの言葉を入れること
- 嘘や誇張は書かないこと
`

        // モデル選択ロジック（generate-replyと同じ）
        const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        let targetModel = 'models/gemini-1.5-flash';

        try {
            const modelsResp = await fetch(listModelsUrl)
            if (modelsResp.ok) {
                const modelsData = await modelsResp.json()
                const availableModels = modelsData.models || []

                // 優先検索 (Flash -> Pro)
                const preferredOrder = ['gemini-1.5-flash', 'gemini-flash', 'gemini-1.5-pro']
                let foundModel = null
                for (const pref of preferredOrder) {
                    foundModel = availableModels.find((m: any) =>
                        m.name.includes(pref) && m.supportedGenerationMethods?.includes('generateContent')
                    )
                    if (foundModel) break
                }

                if (foundModel) targetModel = foundModel.name
            }
        } catch (e) {
            console.warn('Error fetching models, utilizing default:', e)
        }

        const modelResourceName = targetModel.startsWith('models/') ? targetModel : `models/${targetModel}`
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelResourceName}:generateContent?key=${apiKey}`

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error?.message || 'Gemini API Error')
        }

        const data = await response.json()
        const review = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!review) throw new Error('No review generated')

        return NextResponse.json({ review })

    } catch (error: any) {
        console.error('AI Review Generation Error:', error)
        return NextResponse.json(
            { error: error.message || 'AI生成に失敗しました' },
            { status: 500 }
        )
    }
}
