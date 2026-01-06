'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Image as ImageIcon, Calendar, CheckCircle2, RefreshCw, AlertCircle, Share2, MapPin } from 'lucide-react'
import { Post } from '@/types'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs' // Unused, can be removed or kept if needed, but not used
import { fetchInstagramMedia, InstagramMedia } from '@/lib/instagram-api'
import { createGBPPost, fetchGBPAccounts, fetchGBPLocations } from '@/lib/google-api'

const mockGbpPosts: Post[] = [
    {
        id: '1',
        userId: 'user1',
        content: '本日のおすすめランチをご紹介！季節の野菜をたっぷり使った特製パスタです🍝',
        imageUrl: undefined,
        platform: 'gbp',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
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

    // Use the shared vanilla client (same as settings page)
    // const supabase = createBrowserClient(...) // Removed
    // Note: 'supabase' is now imported from '@/lib/supabase' at the top level

    const [localPosts] = useState<Post[]>(mockGbpPosts)
    const [igPosts, setIgPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [syncingId, setSyncingId] = useState<string | null>(null)

    useEffect(() => {
        loadInstagramPosts()
    }, [])

    const loadInstagramPosts = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                console.log('No session found')
                return
            }

            console.log('Session user ID:', session.user.id)

            // Fetch Instagram token from integrations table
            const { data: integration, error: dbError } = await supabase
                .from('integrations')
                .select('access_token')
                .eq('user_id', session.user.id)
                .eq('provider', 'instagram')
                .single()

            if (dbError) {
                console.error('Database error fetching integration:', dbError)
                if (dbError.code !== 'PGRST116') {
                    throw new Error('連携情報の取得に失敗しました: ' + dbError.message)
                }
            }

            const token = integration?.access_token
            console.log('Fetched token:', token ? 'Found' : 'Not Found')

            if (token) {
                const media = await fetchInstagramMedia(token)
                const formattedPosts = media.map(m => convertIgMediaToPost(m))
                setIgPosts(formattedPosts)
            } else {
                console.log('No Instagram integration found for user:', session.user.id)
                // No error needed if not linked, just don't show posts
            }
        } catch (err: any) {
            console.error('Failed to load IG posts:', err)
            let errorMsg = 'Instagramの投稿を取得できませんでした'
            if (err instanceof Error) {
                errorMsg = err.message
            } else if (typeof err === 'object') {
                errorMsg = JSON.stringify(err)
            } else {
                errorMsg = String(err)
            }
            // Only show error text if it's not a "No connected account" expected error
            if (!errorMsg.includes('No Instagram integration')) {
                setError(`${errorMsg}`)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSyncToGBP = async (post: Post) => {
        if (!confirm('この投稿をGoogleマップ（ビジネスプロフィール）にも投稿しますか？')) return

        setSyncingId(post.id)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('認証されていません')

            // Fetch Google token from integrations table
            const { data: integration } = await supabase
                .from('integrations')
                .select('access_token')
                .eq('user_id', session.user.id)
                .eq('provider', 'google')
                .single()

            // Fallback to session token only if it is likely Google (which is default login now)
            const token = integration?.access_token || session.provider_token

            if (!token) throw new Error('Google連携トークンが見つかりません')

            // 1. アカウント取得
            const accounts = await fetchGBPAccounts(token)
            const accountId = accounts.accounts?.[0]?.name
            if (!accountId) throw new Error('Googleビジネスプロフィールアカウントが見つかりません')

            // 2. 店舗取得 (最初の1店舗)
            const locations = await fetchGBPLocations(token, accountId)
            const locationId = locations.locations?.[0]?.name
            if (!locationId) throw new Error('店舗情報が見つかりません')

            // 3. 投稿作成
            await createGBPPost(token, locationId, post.content, post.imageUrl)

            alert('Googleマップへの投稿が完了しました！')

        } catch (err: any) {
            console.error('Sync Error:', err)
            let msg = err.message
            if (msg.includes('401') || msg.includes('403')) {
                msg = 'Google認証に失敗しました。一度ログアウトし、Googleアカウントでログインし直してください。（現在Facebookログイン中のためGoogle APIが使えません）'
            } else if (msg.includes('429')) {
                msg = 'Google APIの使用制限(Quota)を超過しているため、現在は投稿できません。'
            }
            alert(`投稿に失敗しました:\n${msg}`)
        } finally {
            setSyncingId(null)
        }
    }

    const convertIgMediaToPost = (media: InstagramMedia): Post => {
        return {
            id: media.id,
            userId: 'instagram-user',
            content: media.caption || '',
            imageUrl: media.media_url,
            platform: 'instagram',
            status: 'published',
            publishedAt: new Date(media.timestamp),
            createdAt: new Date(media.timestamp)
        }
    }

    // 全ての投稿を統合してソート
    const allPosts = [...localPosts, ...igPosts].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return (
        <div className="min-h-screen bg-white pb-safe">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 w-full bg-white border-b border-border/50" style={{ backgroundColor: '#ffffff' }}>
                <div className="pt-safe">
                    <div className="relative flex items-center justify-center h-16 px-6">
                        <h1 className="text-xl font-bold text-foreground">投稿</h1>

                        {/* 右側アクションエリア (絶対配置) */}
                        <div className="absolute right-6">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={loadInstagramPosts}
                                disabled={loading}
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-4 pt-6 md:pt-8">
                <div className="text-center md:text-left">
                    <p className="text-muted-foreground text-sm">
                        GBPとInstagramの投稿管理
                    </p>
                </div>
                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                        <Link href="/settings/integrations" className="underline font-bold ml-1">
                            連携設定を確認
                        </Link>
                    </div>
                )}

                {!loading && igPosts.length === 0 && !error && (
                    <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-md flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Instagramの投稿が表示されない場合は
                        <Link href="/settings/integrations" className="underline font-bold">
                            連携設定
                        </Link>
                        を行ってください
                    </div>
                )}

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">すべて</TabsTrigger>
                        <TabsTrigger value="gbp">GBP (Google)</TabsTrigger>
                        <TabsTrigger value="instagram">Instagram</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4 mt-4">
                        {allPosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onSync={() => handleSyncToGBP(post)}
                                isSyncing={syncingId === post.id}
                            />
                        ))}
                        {allPosts.length === 0 && <EmptyState />}
                    </TabsContent>

                    <TabsContent value="gbp" className="space-y-4 mt-4">
                        {localPosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                            // GBP posts cannot be synced to GBP again
                            />
                        ))}
                        {localPosts.length === 0 && <EmptyState />}
                    </TabsContent>

                    <TabsContent value="instagram" className="space-y-4 mt-4">
                        {igPosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onSync={() => handleSyncToGBP(post)}
                                isSyncing={syncingId === post.id}
                            />
                        ))}
                        {igPosts.length === 0 && <EmptyState />}
                    </TabsContent>
                </Tabs>
            </div>

            {/* FAB - 新規投稿ボタン */}
            <Link href="/posts/new">
                <Button
                    size="lg"
                    className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90 text-white flex items-center justify-center p-0"
                >
                    <Plus className="w-8 h-8" />
                </Button>
            </Link>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="text-center py-12 text-muted-foreground">
            <p>投稿が見つかりません</p>
        </div>
    )
}

function PostCard({ post, onSync, isSyncing }: { post: Post, onSync?: () => void, isSyncing?: boolean }) {
    const statusConfig = {
        draft: { label: '下書き', variant: 'outline' as const, bg: 'bg-muted' },
        scheduled: { label: '予約中', variant: 'secondary' as const, bg: 'bg-orange-50' },
        published: { label: '公開済', variant: 'default' as const, bg: 'bg-white' },
    }

    // Instagramの場合は画像URLを優先、なければプレースホルダー
    const displayImage = post.imageUrl

    return (
        <Card className={`overflow-hidden hover:shadow-md transition-shadow ${post.status === 'scheduled' ? 'border-orange-200 bg-orange-50/30' : ''}`}>
            <CardContent className="p-0">
                <div className="flex">
                    {/* 画像サムネイル */}
                    <div className="w-24 h-24 bg-muted flex-shrink-0 relative">
                        {displayImage ? (
                            <img src={displayImage} alt="Post thumbnail" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                        )}
                        {/* プラットフォームアイコン小 */}
                        <div className="absolute top-1 left-1">
                            {post.platform === 'instagram' ? (
                                <div className="bg-pink-500/90 p-1 rounded-sm text-white shadow-sm">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                </div>
                            ) : (
                                <div className="bg-blue-500/90 p-1 rounded-sm text-white shadow-sm">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /></svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* コンテンツ */}
                    <div className="flex-1 p-3 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <Badge variant={statusConfig[post.status].variant} className="text-[10px] px-2 h-5">
                                {statusConfig[post.status].label}
                            </Badge>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {formatDate(post.createdAt)}
                            </span>
                        </div>

                        <p className="text-sm text-foreground/90 line-clamp-2 mb-2 leading-relaxed">
                            {post.content}
                        </p>

                        {/* ステータス別の詳細情報 */}
                        {post.status === 'scheduled' && post.scheduledAt && (
                            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                                <Calendar className="w-3 h-3" />
                                予約: {formatDate(post.scheduledAt)}
                            </div>
                        )}

                        {/* Googleマップ同期ボタン (Instagram投稿のみ) */}
                        {post.platform === 'instagram' && onSync && (
                            <div className="mt-2 text-right">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                    onClick={onSync}
                                    disabled={isSyncing}
                                >
                                    {isSyncing ? (
                                        <>
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            送信中...
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="w-3 h-3" />
                                            Googleマップに投稿
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
