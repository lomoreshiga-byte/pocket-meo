'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Image as ImageIcon, Calendar, CheckCircle2, RefreshCw } from 'lucide-react'
import { Post } from '@/types'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { fetchInstagramMedia } from '@/lib/instagram-api'
import { uploadImage, downloadImageAsBlob } from '@/lib/storage'

export default function PostsPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    const fetchPosts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            if (data) {
                const mappedPosts: Post[] = data.map((item: any) => ({
                    id: item.id,
                    userId: item.user_id,
                    content: item.content,
                    imageUrl: item.image_url,
                    platform: item.platform,
                    status: item.status,
                    scheduledAt: item.scheduled_at ? new Date(item.scheduled_at) : undefined,
                    publishedAt: item.published_at ? new Date(item.published_at) : undefined,
                    createdAt: new Date(item.created_at),
                }))
                setPosts(mappedPosts)
            }
        } catch (error) {
            console.error('Error fetching posts:', error)
        } finally {
            setLoading(false)
        }
    }

    const processAndSavePosts = async (mediaList: any[], userId: string) => {
        const postsToInsert = []

        for (const m of mediaList) {
            let imageUrl = null

            // 画像があればStorageにアップロード
            if (m.media_url) {
                // ローカル開発用モックURLの場合はfetch可能
                // 本番URLの場合はCORSに注意が必要
                const blob = await downloadImageAsBlob(m.media_url)
                if (blob) {
                    const fileName = `${userId}/${Date.now()}_${m.id}.jpg`
                    imageUrl = await uploadImage(blob, fileName)
                }
            }

            postsToInsert.push({
                user_id: userId,
                content: m.caption || '',
                image_url: imageUrl,
                platform: 'instagram',
                status: 'draft',
                created_at: new Date().toISOString()
            })
        }

        if (postsToInsert.length > 0) {
            const { error } = await supabase.from('posts').insert(postsToInsert)
            if (error) throw error
        }

        return postsToInsert.length
    }

    useEffect(() => {
        fetchPosts()

        // 自動チェック機能
        const checkInstagramUpdates = async () => {
            // セッション内でチェック済みならスキップ
            if (sessionStorage.getItem('insta_checked')) return

            try {
                // チェック済みフラグを立てる
                sessionStorage.setItem('insta_checked', 'true')

                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Instagramから投稿を取得（モック）
                // ユーザーに気づかれないようにサイレント実行したいため、ここではローディング表示しない
                const mediaList = await fetchInstagramMedia('dummy_token')

                if (mediaList.length === 0) return

                // 重複チェック
                const { data: existingPosts } = await supabase
                    .from('posts')
                    .select('content')
                    .eq('user_id', user.id)
                    .in('content', mediaList.map(m => m.caption))

                const existingContents = new Set(existingPosts?.map(p => p.content) || [])
                const newItems = mediaList.filter(m => !existingContents.has(m.caption))

                if (newItems.length > 0) {
                    // 新着がある場合のみユーザーに確認
                    if (confirm(`Instagramに新しい投稿が${newItems.length}件あります。取り込みますか？\n（画像も自動で保存されます）`)) {
                        setSyncing(true)

                        await processAndSavePosts(newItems, user.id)

                        await fetchPosts()
                        alert(`${newItems.length}件の投稿を取り込みました！`)
                    }
                }
            } catch (error) {
                console.error('Auto sync error:', error)
            } finally {
                setSyncing(false)
            }
        }

        // 少し遅延させて実行（メインの読み込みを阻害しないため）
        const timer = setTimeout(checkInstagramUpdates, 1000)
        return () => clearTimeout(timer)
    }, [])

    const handleSyncInstagram = async () => {
        setSyncing(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('ログインが必要です')
                return
            }

            // Instagramから投稿を取得（モック）
            const mediaList = await fetchInstagramMedia('dummy_token')

            if (mediaList.length === 0) {
                alert('新しいInstagram投稿は見つかりませんでした')
                return
            }

            // 重複チェック: 同じ本文の投稿が既に存在するか確認
            // 注意: 本来はInstagram IDで判定すべきだが、今回は簡易的に本文で判定
            const { data: existingPosts } = await supabase
                .from('posts')
                .select('content')
                .eq('user_id', user.id)
                .in('content', mediaList.map(m => m.caption))

            const existingContents = new Set(existingPosts?.map(p => p.content) || [])

            const newItems = mediaList
                .filter(m => !existingContents.has(m.caption))

            if (newItems.length > 0) {
                await processAndSavePosts(newItems, user.id)

                await fetchPosts() // リストを再読込
                alert(`${newItems.length}件の投稿を取り込みました！`)
            } else {
                alert('新しい投稿はありません（すべて取り込み済みです）')
            }

        } catch (error: any) {
            console.error('Sync error:', error)
            alert(`同期に失敗しました: ${error.message}`)
        } finally {
            setSyncing(false)
        }
    }

    const draftPosts = posts.filter(p => p.status === 'draft')
    const scheduledPosts = posts.filter(p => p.status === 'scheduled')
    const publishedPosts = posts.filter(p => p.status === 'published')

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p>読み込み中...</p>
            </div>
        )
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
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleSyncInstagram}
                        disabled={syncing}
                        className="flex items-center gap-1"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? '同期中...' : 'Insta同期'}
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-6 pb-24">
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
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        公開済み
                        <Badge variant="secondary">{publishedPosts.length}</Badge>
                    </h2>
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
                    className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90 text-primary-foreground"
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

    const platformIcons = {
        gbp: '🏢',
        instagram: '📸',
        both: '🔗',
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
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${post.imageUrl})` }}>
                            {!post.imageUrl && <ImageIcon className="w-8 h-8 text-muted-foreground" />}
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                    )}

                    {/* コンテンツ */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2 mb-2">{post.content}</p>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={statusConfig[post.status].variant} className="text-xs">
                                {statusConfig[post.status].label}
                            </Badge>
                            <span className="text-xs border px-1.5 py-0.5 rounded-full flex items-center gap-1 bg-background text-muted-foreground">
                                {platformIcons[post.platform]} {platformLabels[post.platform]}
                            </span>

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
