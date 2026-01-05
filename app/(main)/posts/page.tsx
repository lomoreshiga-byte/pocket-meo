'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Image as ImageIcon, Calendar, CheckCircle2 } from 'lucide-react'
import { Post } from '@/types'
import { formatDate } from '@/lib/utils'

// モックデータ
const mockPosts: Post[] = [
    {
        id: '1',
        userId: 'user1',
        content: '本日のおすすめランチをご紹介！季節の野菜をたっぷり使った特製パスタです🍝',
        imageUrl: undefined,
        platform: 'both',
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
    },
    {
        id: '3',
        userId: 'user1',
        content: 'ご来店ありがとうございました！素敵な笑顔をいただきました😊',
        imageUrl: '/mock-image.jpg',
        platform: 'instagram',
        status: 'published',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1日前
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    },
]

export default function PostsPage() {
    const [posts] = useState(mockPosts)

    const draftPosts = posts.filter(p => p.status === 'draft')
    const scheduledPosts = posts.filter(p => p.status === 'scheduled')
    const publishedPosts = posts.filter(p => p.status === 'published')

    return (
        <div className="min-h-screen bg-background">
            {/* ヘッダー */}
            <div className="bg-primary text-primary-foreground pt-safe sticky top-0 z-10">
                <div className="p-4">
                    <h1 className="text-2xl font-bold">投稿</h1>
                    <p className="text-primary-foreground/80 text-sm mt-1">
                        GBPとInstagramの投稿を管理
                    </p>
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
                    className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40"
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
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
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
                            <Badge variant="outline" className="text-xs">
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
