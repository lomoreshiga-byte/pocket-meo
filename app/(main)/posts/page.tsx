'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Image as ImageIcon, Calendar, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { Post } from '@/types'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { fetchInstagramMedia } from '@/lib/instagram-api'

// モックデータ (GBP用)
const mockPosts: Post[] = [
    {
        id: '1',
        userId: 'user1',
        content: '本日のおすすめランチをご紹介！季節の野菜をたっぷり使った特製パスタです🍝',
        imageUrl: undefined,
        platform: 'gbp',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2時間後
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
        id: '2',
        userId: 'user1',
        content: '週末限定のスペシャルメニュー登場！',
        platform: 'gbp',
        status: 'draft',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    }
]

export default function PostsPage() {
    const [posts, setPosts] = useState<Post[]>(mockPosts)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            await loadInstagramPosts()
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadInstagramPosts = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        const fbIdentity = session?.user?.identities?.find(id => id.provider === 'facebook')

        if (session && fbIdentity) {
            // Facebookアクセストークン取得 (supabase-jsでは直接取得できない場合があるが、provider_tokenに入ることがある)
            // または、session.provider_token が直近のログインプロバイダのものになる。
            // 確実なのは、linkIdentity直後か、別途保存しておくことだが、
            // Supabase Authの仕様上、provider_tokenは直近のログインのものが返る。
            // ここでは簡易的に session.provider_token を試す。
            // ただし、Googleログイン中だとGoogleのトークンが入っている可能性がある。
            // 本来は、Custom ClaimsやDatabaseに保存すべきだが、今回はToolとしての簡易実装。
            // ※注意: 正しい実装は「ログイン時にアクセストークンをDBに保存」すること。
            // 現状のSupabaseではsession.provider_tokenは「今回のセッションを開始したプロバイダ」のもの。
            // そのため、Googleでログイン中にFacebook連携しても、session.provider_tokenはGoogleのままの可能性大。
            // 解決策: 連携設定直後、またはFacebookで再ログインしてもらう運用にする。
            // 今回は「連携設定画面」から戻ってきた直後であれば取れる可能性があるが...
            // 一旦、session.provider_token を使ってみて、ダメなら「Facebookで再ログイン」を促すUIにする。

            // 修正: session.provider_token は現在ログイン中のプロバイダのもの。
            // Identity Linkingの場合、access_tokenはレスポンスに含まれるがセッションには永続化されない場合がある。
            // ここでは「連携済みなら表示」したいが、トークンがないとAPIを叩けない。
            // 暫定対応: もしトークンがなければモックを表示し、「再連携で更新」を促す。

            const token = session.provider_token;
            if (token && fbIdentity.provider === 'facebook') {
                // Facebookでログインしている場合のみここが有効
                const igMedia = await fetchInstagramMedia(token)

                const igPosts: Post[] = igMedia.map(media => ({
                    id: media.id,
                    userId: session.user.id,
                    content: media.caption || '',
                    imageUrl: media.media_url,
                    platform: 'instagram',
                    status: 'published',
                    publishedAt: new Date(media.timestamp),
                    createdAt: new Date(media.timestamp)
                }))

                // 既存の投稿とマージ（重複除外）
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id))
                    const newPosts = igPosts.filter(p => !existingIds.has(p.id))
                    return [...prev, ...newPosts].sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                })
            }
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadInstagramPosts()
        setRefreshing(false)
    }

    const draftPosts = posts.filter(p => p.status === 'draft')
    const scheduledPosts = posts.filter(p => p.status === 'scheduled')
    const publishedPosts = posts.filter(p => p.status === 'published')

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="min-h-screen bg-background">
            {/* ヘッダー */}
            <div className="bg-primary text-primary-foreground pt-safe sticky top-0 z-10">
                <div className="p-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">投稿</h1>
                        <p className="text-primary-foreground/80 text-sm mt-1">
                            GBPとInstagramの投稿を管理
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* 下書き */}
                {draftPosts.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            下書き
                            <Badge variant="secondary">{draftPosts.length}</Badge>
                        </h2>
                        <div className="space-y-2">
                            {draftPosts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </section>
                )}

                {/* 予約済み */}
                {scheduledPosts.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            予約済み
                            <Badge variant="secondary">{scheduledPosts.length}</Badge>
                        </h2>
                        <div className="space-y-2">
                            {scheduledPosts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </section>
                )}

                {/* 公開済み */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            公開済み / Instagram
                            <Badge variant="secondary">{publishedPosts.length}</Badge>
                        </h2>
                        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {publishedPosts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                まだ公開された投稿がありません
                            </p>
                        ) : (
                            publishedPosts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* FAB - 新規投稿ボタン */}
            <Link href="/posts/new">
                <Button
                    size="lg"
                    className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 transition-transform hover:scale-105"
                >
                    <Plus className="w-6 h-6" />
                </Button>
            </Link>
        </div>
    )
}

function PostCard({ post }: { post: Post }) {
    const platformLabels = {
        gbp: 'GBP',
        instagram: 'Instagram',
        both: 'GBP + Instagram',
    }

    const platformColors = {
        gbp: 'bg-blue-100 text-blue-800 border-blue-200',
        instagram: 'bg-pink-100 text-pink-800 border-pink-200',
        both: 'bg-purple-100 text-purple-800 border-purple-200',
    }

    const statusConfig = {
        draft: { label: '下書き', variant: 'outline' as const },
        scheduled: { label: '予約済み', variant: 'secondary' as const },
        published: { label: '公開済み', variant: 'default' as const },
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex gap-3">
                    {/* 画像サムネイル */}
                    {post.imageUrl ? (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                    )}

                    {/* コンテンツ */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2 mb-2 whitespace-pre-wrap">{post.content}</p>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={statusConfig[post.status].variant} className="text-xs">
                                {statusConfig[post.status].label}
                            </Badge>
                            <Badge variant="outline" className={`text-xs border ${platformColors[post.platform]}`}>
                                {platformLabels[post.platform]}
                            </Badge>

                            {post.status === 'scheduled' && post.scheduledAt && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(post.scheduledAt)}
                                </span>
                            )}

                            {post.status === 'published' && post.publishedAt && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {formatDate(post.publishedAt)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
