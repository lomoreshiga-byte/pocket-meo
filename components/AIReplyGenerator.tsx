'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Sparkles, X, Send } from 'lucide-react'
import { Review, ReplyTone } from '@/types'

interface AIReplyGeneratorProps {
    review: Review
    onClose: () => void
    onSubmit: (replyText: string) => void
}

export function AIReplyGenerator({ review, onClose, onSubmit }: AIReplyGeneratorProps) {
    const [selectedTone, setSelectedTone] = useState<ReplyTone>('grateful')
    const [generatedReply, setGeneratedReply] = useState(review.replyText || '')
    const [isGenerating, setIsGenerating] = useState(false)
    const [isEditing, setIsEditing] = useState(!!review.replyText)

    const tones = [
        { value: 'grateful' as ReplyTone, label: '感謝', emoji: '🙏' },
        { value: 'apologetic' as ReplyTone, label: '謝罪', emoji: '🙇' },
    ]

    const handleGenerate = async (tone: ReplyTone) => {
        setIsGenerating(true)
        setSelectedTone(tone)

        try {
            const response = await fetch('/api/ai/generate-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewText: review.comment,
                    rating: review.rating,
                    reviewerName: review.reviewerName,
                    tone: tone,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to generate reply')
            }

            const { reply } = await response.json()
            setGeneratedReply(reply)
            setIsEditing(true)
        } catch (error) {
            console.error('Error generating reply:', error)
            alert('返信の生成に失敗しました。もう一度お試しください。')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = () => {
        if (generatedReply.trim()) {
            onSubmit(generatedReply)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300 w-full max-w-sm overflow-hidden">
                {/* ヘッダー */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">AI返信を生成</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* 元のレビュー */}
                    <Card className="p-3 bg-muted/50">
                        <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} filled={star <= review.rating} className="w-4 h-4" />
                            ))}
                        </div>
                        <p className="text-sm">{review.comment}</p>
                    </Card>

                    {/* トーン選択 */}
                    {!isEditing && (
                        <div>
                            <p className="text-sm font-medium mb-2">返信のトーンを選択して生成</p>
                            <div className="grid grid-cols-2 gap-4">
                                {tones.map((tone) => (
                                    <Button
                                        key={tone.value}
                                        variant={selectedTone === tone.value ? 'default' : 'outline'}
                                        onClick={() => handleGenerate(tone.value)}
                                        disabled={isGenerating}
                                        className="h-auto py-6 flex-col gap-2"
                                    >
                                        <span className="text-3xl">{tone.emoji}</span>
                                        <span className="text-sm font-medium">{tone.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 生成された返信 */}
                    {generatedReply && (
                        <div>
                            <p className="text-sm font-medium mb-2">生成された返信</p>
                            <Textarea
                                value={generatedReply}
                                onChange={(e) => setGeneratedReply(e.target.value)}
                                className="min-h-[120px]"
                                placeholder="返信内容を編集できます"
                            />
                        </div>
                    )}

                    {/* アクションボタン */}
                    <div className="flex gap-2">
                        {isGenerating && (
                            <Button disabled className="w-full h-12">
                                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                生成中...
                            </Button>
                        )}

                        {isEditing && (
                            <>
                                <Button
                                    onClick={() => setIsEditing(false)}
                                    variant="outline"
                                    className="flex-1 h-12"
                                >
                                    戻る
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    className="flex-1 h-12"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    送信
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Star({ filled, className }: { filled: boolean; className?: string }) {
    return (
        <svg
            className={className}
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
        </svg>
    )
}
