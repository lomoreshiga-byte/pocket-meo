'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Copy, Star, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function PublicSurveyPage() {
    const [loading, setLoading] = useState(false)
    const [rating, setRating] = useState(5)
    const [keywords, setKeywords] = useState<string[]>([])
    const [comment, setComment] = useState('')
    const [generatedReview, setGeneratedReview] = useState('')

    const predefinedKeywords = [
        '美味しい', '接客が良い', '雰囲気が良い', '提供が早い',
        '価格が手頃', '清潔', '駅チカ', 'おしゃれ'
    ]

    const toggleKeyword = (keyword: string) => {
        if (keywords.includes(keyword)) {
            setKeywords(keywords.filter(k => k !== keyword))
        } else {
            setKeywords([...keywords, keyword])
        }
    }

    const handleGenerate = async () => {
        setLoading(true)
        setGeneratedReview('')

        try {
            const response = await fetch('/api/ai/generate-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating,
                    keywords,
                    comment
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || '口コミの生成に失敗しました')
            }

            setGeneratedReview(data.review)
            toast.success('口コミが生成されました！')

            // 生成されたら自動的にスクロール
            setTimeout(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
            }, 100)

        } catch (error: any) {
            console.error('Error generating review:', error)
            toast.error(error.message || 'エラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedReview)
        toast.success('クリップボードにコピーしました')
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-20">
            <div className="max-w-md mx-auto space-y-6">
                <header className="text-center py-6 space-y-2">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">アンケートにご協力ください</h1>
                    <p className="text-sm text-slate-500">
                        入力内容からAIが口コミ文を作成します。<br />
                        作成された文章はGoogleマップに投稿できます。
                    </p>
                </header>

                <Card className="shadow-sm border-0 sm:border">
                    <CardHeader>
                        <CardTitle className="text-lg">評価をお願いします</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* 星評価 */}
                        <div className="space-y-3 text-center">
                            <div className="flex justify-center items-center gap-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`transition-all active:scale-90 ${star <= rating ? 'text-amber-400' : 'text-slate-200'}`}
                                    >
                                        <Star className="w-10 h-10 fill-current" />
                                    </button>
                                ))}
                            </div>
                            <div className="font-bold text-amber-500 text-lg">
                                {rating}点
                            </div>
                        </div>

                        {/* キーワード選択 */}
                        <div className="space-y-3">
                            <Label>良かった点 (複数選択可)</Label>
                            <div className="flex flex-wrap gap-2">
                                {predefinedKeywords.map((kw) => (
                                    <button
                                        key={kw}
                                        type="button"
                                        onClick={() => toggleKeyword(kw)}
                                        className={`
                                            px-3 py-2 rounded-full text-sm border transition-all active:scale-95
                                            ${keywords.includes(kw)
                                                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        {kw}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 自由コメント */}
                        <div className="space-y-3">
                            <Label>その他感想 (任意)</Label>
                            <Textarea
                                placeholder="店員の対応が良かった、など..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="resize-none h-24 text-base"
                            />
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full h-12 text-lg font-bold gap-2 shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    AIで口コミを作成
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* 生成結果 */}
                {generatedReview && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-primary bg-primary/5 overflow-hidden">
                            <CardHeader className="bg-primary/10 py-3 px-4 border-b border-primary/10">
                                <CardTitle className="flex justify-between items-center text-base text-primary-900">
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        生成された口コミ
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="bg-white p-4 rounded-lg border border-primary/20 text-sm leading-relaxed whitespace-pre-wrap shadow-sm text-slate-800">
                                    {generatedReview}
                                </div>

                                <Button size="lg" onClick={copyToClipboard} className="w-full gap-2 font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl">
                                    <Copy className="w-4 h-4" />
                                    コピーしてGoogleマップを開く
                                </Button>

                                <p className="text-xs text-slate-500 text-center px-4">
                                    ※上のボタンを押すと文章がコピーされます。その後、Googleマップの投稿画面でペーストしてください。
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
