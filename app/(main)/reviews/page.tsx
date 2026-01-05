'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ReviewCard } from '@/components/ReviewCard'
import { Review } from '@/types'
import { RefreshCw, AlertCircle, Filter } from 'lucide-react'
import { fetchGBPAccounts, fetchGBPLocations, fetchGBPReviews } from '@/lib/google-api'
import { ReviewFilter, FilterConditions } from '@/components/ReviewFilter'
import { subWeeks, subMonths, subYears, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns'

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    // 初期フィルター: すべて表示 (未返信・返信済み、全評価、全期間)
    const [filterConditions, setFilterConditions] = useState<FilterConditions>({
        replyStatus: ['unreplied', 'replied'],
        ratings: [5, 4, 3, 2, 1],
        dateRange: 'all',
        customStartDate: '',
        customEndDate: ''
    })
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
        // 1. 返信状況フィルター
        const status = review.replied ? 'replied' : 'unreplied'
        if (!filterConditions.replyStatus.includes(status)) return false

        // 2. 評価フィルター
        if (!filterConditions.ratings.includes(review.rating)) return false

        // 3. 期間フィルター
        const date = review.createdAt
        const now = new Date()

        if (filterConditions.dateRange === 'all') return true

        if (filterConditions.dateRange === 'custom') {
            if (filterConditions.customStartDate && filterConditions.customEndDate) {
                const start = startOfDay(parseISO(filterConditions.customStartDate))
                const end = endOfDay(parseISO(filterConditions.customEndDate))
                return isWithinInterval(date, { start, end })
            }
            return true
        }

        let thresholdDate
        switch (filterConditions.dateRange) {
            case '1week':
                thresholdDate = subWeeks(now, 1)
                break
            case '1month':
                thresholdDate = subMonths(now, 1)
                break
            case '3months':
                thresholdDate = subMonths(now, 3)
                break
            case '6months':
                thresholdDate = subMonths(now, 6)
                break
            case '1year':
                thresholdDate = subYears(now, 1)
                break
            default:
                return true
        }

        return date >= thresholdDate
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
            <div className="bg-primary text-primary-foreground pt-safe sticky top-0 z-10 transition-all">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold">クチコミ管理 (New)</h1>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
                                onClick={loadFromGoogle}
                                disabled={syncing}
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                        {unrepliedCount > 0 && (
                            <span className="bg-white/20 text-white px-2 py-0.5 rounded text-xs font-medium">
                                未返信 {unrepliedCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 pb-24">
                {error && (
                    <div className="mb-4 bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2 border border-destructive/20">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* 新しいフィルターコンポーネント */}
                <ReviewFilter
                    onFilterChange={setFilterConditions}
                    initialConditions={filterConditions}
                />

                {/* クチコミリスト */}
                <div className="space-y-4">
                    {filteredReviews.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed">
                            <Filter className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground font-medium">
                                条件に一致するクチコミがありません
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                フィルター条件を変更してみてください
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
        </div>
    )
}
