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
        const { rating, keywords, comment } = await request.json()

        const promptText = `
あなたはプロのコピーライターです。
以下のアンケート結果を元に、Googleマップに投稿するための自然で好意的な口コミ文を生成してください。
ユーザー（顧客）になりきって書いてください。

【アンケート結果】
評価: ${rating}/5
良かった点: ${keywords?.join(', ') || '特になし'}
自由記述: ${comment || '特になし'}

【条件】
- 自然な日本語であること
- 絵文字を適度に使用して親しみやすくすること
- 150文字〜200文字程度
- 指定された「良かった点」や「自由記述」の内容を必ず盛り込むこと
- 嘘や誇張は書かないこと
- 評価が低い場合でも、ポジティブな表現に変換するか、建設的な意見として書くこと
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
