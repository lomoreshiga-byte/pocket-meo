'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Sparkles, Copy, Star, Check, Utensils, Users, Clock, Coffee } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function PublicSurveyPage() {
    const [loading, setLoading] = useState(false)
    const [generatedReview, setGeneratedReview] = useState('')

    // Form State
    const [visitCount, setVisitCount] = useState<string>('')
    const [visitTime, setVisitTime] = useState<string>('')
    const [visitScene, setVisitScene] = useState<string>('')

    // Ratings
    const [rating, setRating] = useState(5)
    const [foodRating, setFoodRating] = useState(0)
    const [serviceRating, setServiceRating] = useState(0)
    const [atmosphereRating, setAtmosphereRating] = useState(0)
    const [costRating, setCostRating] = useState(0)

    const [bestPoint, setBestPoint] = useState('')
    const [comment, setComment] = useState('')

    const handleGenerate = async () => {
        // Validation (簡易)
        if (!visitCount || !visitTime || !visitScene) {
            toast.error('必須項目（来店回数など）を選択してください')
            // 一番上へスクロール
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        setLoading(true)
        setGeneratedReview('')

        try {
            const response = await fetch('/api/ai/generate-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitCount,
                    visitTime,
                    visitScene,
                    rating,
                    foodRating: foodRating || rating, // 未入力なら総合評価を使用
                    serviceRating: serviceRating || rating,
                    atmosphereRating: atmosphereRating || rating,
                    costRating: costRating || rating,
                    bestPoint,
                    comment
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || '口コミの生成に失敗しました')
            }

            setGeneratedReview(data.review)
            toast.success('口コミが生成されました！')

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
                        率直なご感想をお聞かせください。<br />
                        AIがあなたに代わって口コミ文章を作成します。
                    </p>
                </header>

                <div className="space-y-4">
                    {/* Q1-Q3: 基本情報 */}
                    <Card className="shadow-sm border-0 sm:border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" /> 本日のご利用について
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">来店回数 <span className="text-red-500">*</span></Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['初めて', '2回目', '3回以上'].map(opt => (
                                        <SelectionButton key={opt} label={opt} active={visitCount === opt} onClick={() => setVisitCount(opt)} />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">時間帯 <span className="text-red-500">*</span></Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['ランチ', 'カフェ', 'ディナー'].map(opt => (
                                        <SelectionButton key={opt} label={opt} active={visitTime === opt} onClick={() => setVisitTime(opt)} />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">利用シーン <span className="text-red-500">*</span></Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['一人で', '友人と', '家族と', 'デート', 'ビジネス'].map(opt => (
                                        <SelectionButton key={opt} label={opt} active={visitScene === opt} onClick={() => setVisitScene(opt)} />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Q4-Q8: 詳細評価 */}
                    <Card className="shadow-sm border-0 sm:border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                                <Star className="w-4 h-4 text-primary" /> 満足度評価
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* 総合評価 */}
                            <div className="space-y-2 text-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <Label className="text-sm font-bold block mb-2">総合評価</Label>
                                <div className="flex justify-center items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition-transform active:scale-90"
                                        >
                                            <Star className={cn("w-10 h-10 transition-colors", star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200')} />
                                        </button>
                                    ))}
                                </div>
                                <div className="text-sm font-bold text-amber-500 h-5">
                                    {rating === 5 ? 'とても満足！' : rating === 4 ? '満足' : rating === 3 ? '普通' : rating === 2 ? 'やや不満' : '不満'}
                                </div>
                            </div>

                            {/* 詳細項目 */}
                            <div className="space-y-6 px-2">
                                <RatingRow label="料理・ドリンク" value={foodRating} onChange={setFoodRating} icon={<Utensils className="w-4 h-4" />} />
                                <RatingRow label="接客・サービス" value={serviceRating} onChange={setServiceRating} icon={<Users className="w-4 h-4" />} />
                                <RatingRow label="お店の雰囲気" value={atmosphereRating} onChange={setAtmosphereRating} icon={<Coffee className="w-4 h-4" />} />
                                <RatingRow label="コストパフォーマンス" value={costRating} onChange={setCostRating} icon={<span className="text-xs font-bold w-4 text-center">¥</span>} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Q9-Q10: コメント */}
                    <Card className="shadow-sm border-0 sm:border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" /> 感想をお聞かせください
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label>一番良かった点・気に入ったメニュー</Label>
                                <Input
                                    placeholder="例: ハンバーグが美味しかった、店員さんが親切だった"
                                    value={bestPoint}
                                    onChange={(e) => setBestPoint(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>その他ご意見・ご要望 (任意)</Label>
                                <Textarea
                                    placeholder="もっとこうして欲しい、などあれば..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="resize-none h-24"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full h-14 text-lg font-bold gap-2 shadow-xl shadow-primary/20 rounded-xl"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                AIで口コミを作成する
                            </>
                        )}
                    </Button>
                </div>

                {/* 生成結果 */}
                {generatedReview && (
                    <div className="pt-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-2 border-primary bg-primary/5 overflow-hidden shadow-2xl">
                            <CardHeader className="bg-primary/10 py-3 px-4 border-b border-primary/10">
                                <CardTitle className="flex justify-between items-center text-base text-primary-900">
                                    <span className="flex items-center gap-2 font-bold">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        生成された口コミ
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="bg-white p-4 rounded-lg border border-primary/20 text-sm leading-relaxed whitespace-pre-wrap shadow-sm text-slate-800">
                                    {generatedReview}
                                </div>

                                <Button size="lg" onClick={copyToClipboard} className="w-full h-12 gap-2 font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
                                    <Copy className="w-4 h-4" />
                                    コピーしてGoogleマップを開く
                                </Button>

                                <div className="text-center">
                                    <p className="text-xs text-slate-500 mb-2">
                                        ご協力ありがとうございました！
                                    </p>
                                    <Button variant="link" size="sm" onClick={() => window.location.reload()} className="text-slate-400">
                                        最初に戻る
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}

// ------------------------------------------------------------------
// Sub Components
// ------------------------------------------------------------------

function SelectionButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "py-2 px-1 rounded-md text-sm font-medium border transition-all active:scale-95",
                active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
        >
            {label}
        </button>
    )
}

function RatingRow({ label, value, onChange, icon }: { label: string, value: number, onChange: (val: number) => void, icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
                {icon}
                <span>{label}</span>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="p-1 focus:outline-none transition-transform active:scale-90"
                    >
                        <Star className={cn("w-5 h-5", star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200')} />
                    </button>
                ))}
            </div>
        </div>
    )
}
