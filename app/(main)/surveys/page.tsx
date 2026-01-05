'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Sparkles, Copy, Check, Star } from 'lucide-react'
import { toast } from 'sonner'

export default function SurveyPage() {
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
        setGeneratedReview('') // Reset previous result

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
        <div className="space-y-6 max-w-2xl mx-auto pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">アンケート入力</h1>
                <p className="text-muted-foreground">
                    お客様の満足度や感想を入力すると、AIが自然な口コミ文を自動生成します。
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>評価を入力</CardTitle>
                    <CardDescription>お客様の率直な感想を入力してください</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 星評価 */}
                    <div className="space-y-3">
                        <Label>総合評価: {rating}点</Label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`transition-all hover:scale-110 ${star <= rating ? 'text-amber-400' : 'text-slate-200'}`}
                                >
                                    <Star className="w-8 h-8 fill-current" />
                                </button>
                            ))}
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
                                        px-3 py-1.5 rounded-full text-sm border transition-all
                                        ${keywords.includes(kw)
                                            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                                            : 'bg-background hover:bg-muted'
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
                        <Label>自由コメント (任意)</Label>
                        <Textarea
                            placeholder="その他、具体的な感想があれば入力してください..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none h-24"
                        />
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full h-12 text-lg font-bold gap-2"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                AIで口コミを生成する
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* 生成結果 */}
            {generatedReview && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex justify-between items-center text-lg">
                            <span>生成された口コミ</span>
                            <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
                                <Copy className="w-4 h-4" />
                                コピー
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-background p-4 rounded-md border text-sm leading-relaxed whitespace-pre-wrap">
                            {generatedReview}
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            <p className="text-xs text-muted-foreground text-center">
                                Googleマップなどの投稿画面に貼り付けて使用してください
                            </p>
                            {/* 将来的にはここにGBPへの直接リンクなどを配置 */}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
