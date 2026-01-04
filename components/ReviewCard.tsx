'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { Review } from '@/types'
import { formatDate } from '@/lib/utils'
import { AIReplyGenerator } from './AIReplyGenerator'

interface ReviewCardProps {
    review: Review
    onReplySubmit: (reviewId: string, replyText: string) => void
}

export function ReviewCard({ review, onReplySubmit }: ReviewCardProps) {
    const [showAIGenerator, setShowAIGenerator] = useState(false)

    const handleReplyGenerated = (replyText: string) => {
        onReplySubmit(review.id, replyText)
        setShowAIGenerator(false)
    }

    return (
        <>
            <Card className="p-4 space-y-3">
                {/* レビュアー情報 */}
                <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={review.reviewerPhotoUrl} alt={review.reviewerName} />
                        <AvatarFallback>{review.reviewerName[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{review.reviewerName}</p>
                            {review.replied && (
                                <Badge variant="secondary" className="text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    返信済み
                                </Badge>
                            )}
                        </div>

                        {/* 星評価 */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        filled={star <= review.rating}
                                        className="w-4 h-4"
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {formatDate(review.createdAt)}
                            </span>
                        </div>

                        {/* コメント */}
                        <p className="text-sm leading-relaxed">{review.comment}</p>
                    </div>
                </div>

                {/* 返信エリア */}
                {review.replied && review.replyText ? (
                    <div className="bg-muted/50 rounded-lg p-3 ml-13">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                            あなたの返信
                        </p>
                        <p className="text-sm">{review.replyText}</p>
                        {review.repliedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(review.repliedAt)}
                            </p>
                        )}
                    </div>
                ) : (
                    <Button
                        onClick={() => setShowAIGenerator(true)}
                        className="w-full"
                        variant="outline"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI返信を生成
                    </Button>
                )}
            </Card>

            {/* AI返信生成モーダル */}
            {showAIGenerator && (
                <AIReplyGenerator
                    review={review}
                    onClose={() => setShowAIGenerator(false)}
                    onSubmit={handleReplyGenerated}
                />
            )}
        </>
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
