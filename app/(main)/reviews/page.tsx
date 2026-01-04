'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ReviewCard } from '@/components/ReviewCard'
import { Review } from '@/types'
import { Filter } from 'lucide-react'

// モックデータを削除

type FilterType = 'all' | 'unreplied' | 'high' | 'low'

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [filter, setFilter] = useState<FilterType>('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReviews()
    }, [])

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            if (data) {
                const formattedReviews: Review[] = data.map(r => ({
                    id: r.id,
                    userId: r.user_id,
                    gbpReviewId: r.gbp_review_id,
                    reviewerName: r.reviewer_name,
                    reviewerPhotoUrl: r.reviewer_photo_url,
                    rating: r.rating,
                    comment: r.comment,
                    replied: r.replied,
                    replyText: r.reply_text,
                    createdAt: new Date(r.created_at),
                    repliedAt: r.replied_at ? new Date(r.replied_at) : undefined,
                }))
                setReviews(formattedReviews)
            }
        } catch (error) {
            console.error('Error fetching reviews:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleReplySubmit = async (reviewId: string, replyText: string) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    replied: true,
                    reply_text: replyText,
                    replied_at: new Date().toISOString(),
                })
                .eq('id', reviewId)

            if (error) throw error

            setReviews(prev =>
                prev.map(review =>
                    review.id === reviewId
                        ? {
                            ...review,
                            replied: true,
                            replyText,
                            repliedAt: new Date(),
                        }
                        : review
                )
            )
        } catch (error) {
            console.error('Error submitting reply:', error)
            alert('返信の送信に失敗しました')
        }
    }

    const filteredReviews = reviews.filter(review => {
        if (filter === 'unreplied') return !review.replied
        if (filter === 'high') return review.rating >= 4
        if (filter === 'low') return review.rating <= 3
        return true
    })

    const unrepliedCount = reviews.filter(r => !r.replied).length

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* ヘッダー */}
            <div className="bg-primary text-primary-foreground pt-safe sticky top-0 z-10">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-2xl font-bold">クチコミ</h1>
                        {unrepliedCount > 0 && (
                            <span className="bg-primary-foreground text-primary px-3 py-1 rounded-full text-sm font-semibold">
                                未返信 {unrepliedCount}件
                            </span>
                        )}
                    </div>

                    {/* フィルター */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                        <FilterButton
                            active={filter === 'all'}
                            onClick={() => setFilter('all')}
                        >
                            すべて
                        </FilterButton>
                        <FilterButton
                            active={filter === 'unreplied'}
                            onClick={() => setFilter('unreplied')}
                        >
                            未返信のみ
                        </FilterButton>
                        <FilterButton
                            active={filter === 'high'}
                            onClick={() => setFilter('high')}
                        >
                            高評価
                        </FilterButton>
                        <FilterButton
                            active={filter === 'low'}
                            onClick={() => setFilter('low')}
                        >
                            低評価
                        </FilterButton>
                    </div>
                </div>
            </div>

            {/* クチコミリスト */}
            <div className="p-4 space-y-3 pb-24">
                {filteredReviews.length === 0 ? (
                    <div className="text-center py-12">
                        <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                            該当するクチコミがありません
                        </p>
                    </div>
                ) : (
                    filteredReviews.map(review => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            onReplySubmit={handleReplySubmit}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

function FilterButton({
    active,
    onClick,
    children,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <Button
            variant={active ? 'secondary' : 'ghost'}
            size="sm"
            onClick={onClick}
            className={`whitespace-nowrap ${active ? 'bg-primary-foreground text-primary' : 'text-primary-foreground/80'
                }`}
        >
            {children}
        </Button>
    )
}
