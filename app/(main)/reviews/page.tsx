'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ReviewCard } from '@/components/ReviewCard'
import { Review } from '@/types'
import { Filter, RefreshCw, AlertCircle } from 'lucide-react'
import { fetchGBPAccounts, fetchGBPLocations, fetchGBPReviews } from '@/lib/google-api'

// モックデータを削除

type FilterType = 'all' | 'unreplied' | 'high' | 'low'

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [filter, setFilter] = useState<FilterType>('all')
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchReviews()
    }, [])

    const fetchReviews = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            if (data && data.length > 0) {
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
            } else {
                // データがない場合はモックや初期データを表示せずに、Google同期を促すなどの処理
                // ここでは空にしておく
            }
        } catch (error) {
            console.error('Error fetching reviews:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadFromGoogle = async () => {
        setSyncing(true)
        setError(null)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.provider_token

            if (!token) throw new Error('認証トークンが見つかりません。Googleでログインし直してください。')

            // 1. アカウント取得
            const accounts = await fetchGBPAccounts(token)
            const accountId = accounts.accounts?.[0]?.name
            if (!accountId) throw new Error('Googleビジネスプロフィールアカウントが見つかりません')

            // 2. 店舗取得 (最初の1店舗)
            const locations = await fetchGBPLocations(token, accountId)
            const locationId = locations.locations?.[0]?.name
            if (!locationId) throw new Error('店舗情報が見つかりません')

            // 3. クチコミ取得
            const reviewsData = await fetchGBPReviews(token, accountId, locationId)

            if (reviewsData.reviews) {
                const googleReviews: Review[] = reviewsData.reviews.map((r: any) => ({
                    id: r.reviewId, // 一時的なIDとして使用
                    userId: 'google-user',
                    gbpReviewId: r.reviewId,
                    reviewerName: r.reviewer.displayName,
                    reviewerPhotoUrl: r.reviewer.profilePhotoUrl,
                    rating: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].indexOf(r.starRating) + 1,
                    comment: r.comment || '(コメントなし)',
                    replied: !!r.reviewReply,
                    replyText: r.reviewReply?.comment,
                    createdAt: new Date(r.createTime),
                    repliedAt: r.reviewReply ? new Date(r.reviewReply.updateTime) : undefined,
                }))

                // 日付順にソート
                googleReviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                setReviews(googleReviews)
                alert('Googleから最新のクチコミを取得しました！')
            } else {
                alert('クチコミが見つかりませんでした')
            }

        } catch (err: any) {
            console.error('Sync Reviews Error:', err)
            let msg = err.message
            if (msg.includes('401') || msg.includes('403')) {
                msg = 'Google認証に失敗しました。一度ログアウトし、Googleアカウントでログインし直してください。'
            } else if (msg.includes('429')) {
                msg = 'APIの使用制限(Quota)を超過しているため、現在は取得できません。\n(現在はモックデータまたは以前のデータを表示します)'
            }
            setError(msg)
        } finally {
            setSyncing(false)
        }
    }

    const handleReplySubmit = async (reviewId: string, replyText: string) => {
        // ... (既存の実装)
        alert('現在、リアルタイム同期モードのため返信はDBに保存されませんが、UI上では反映されます')
        // setReviews でローカル更新
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
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">クチコミ</h1>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full"
                                onClick={loadFromGoogle}
                                disabled={syncing}
                            >
                                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                        {unrepliedCount > 0 && (
                            <span className="bg-primary-foreground text-primary px-3 py-1 rounded-full text-sm font-semibold">
                                未返信 {unrepliedCount}件
                            </span>
                        )}
                    </div>

                    {error && (
                        <div className="mb-2 bg-destructive/20 text-white text-xs p-2 rounded flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                        </div>
                    )}

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
