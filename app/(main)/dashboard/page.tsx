import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Calendar, AlertCircle, ChevronRight } from 'lucide-react'

interface ActionCardProps {
    title: string
    description: string
    icon: React.ReactNode
    badge?: number
    href: string
    variant?: 'default' | 'warning'
}

function ActionCard({ title, description, icon, badge, href, variant = 'default' }: ActionCardProps) {
    return (
        <Link href={href}>
            <Card className={`transition-all hover:shadow-md active:scale-[0.98] ${variant === 'warning' ? 'border-destructive/50 bg-destructive/5' : ''
                }`}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${variant === 'warning' ? 'bg-destructive/10' : 'bg-primary/10'
                                }`}>
                                {icon}
                            </div>
                            <div>
                                <CardTitle className="text-lg">{title}</CardTitle>
                                <CardDescription className="text-sm mt-1">
                                    {description}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {badge !== undefined && badge > 0 && (
                                <Badge variant={variant === 'warning' ? 'destructive' : 'default'}>
                                    {badge}
                                </Badge>
                            )}
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </Link>
    )
}

export default function DashboardPage() {
    // モックデータ
    const unrepliedReviews = 3
    const todayPosts = 1
    const isTemporarilyClosed = false

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 md:bg-none">
            {/* ヘッダー */}
            <div className="bg-primary text-primary-foreground pt-safe md:bg-transparent md:text-foreground md:pt-0 md:mb-8">
                <div className="p-6 pb-8 md:p-0">
                    <h1 className="text-2xl font-bold">ダッシュボード</h1>
                    <p className="text-primary-foreground/80 mt-1 md:text-muted-foreground">
                        今日も1日お疲れ様です 👋
                    </p>
                </div>
            </div>

            {/* アクションカード */}
            <div className="px-4 -mt-4 space-y-3 pb-6 md:bg-transparent md:mt-0 md:p-0 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
                {/* 未返信クチコミ */}
                <ActionCard
                    title="未返信のクチコミ"
                    description="早めの返信でお客様との信頼を築きましょう"
                    icon={<MessageSquare className="w-5 h-5 text-primary" />}
                    badge={unrepliedReviews}
                    href="/reviews"
                />

                {/* 本日の投稿予定 */}
                <ActionCard
                    title="本日の投稿予定"
                    description="スケジュール済みの投稿を確認"
                    icon={<Calendar className="w-5 h-5 text-primary" />}
                    badge={todayPosts}
                    href="/posts"
                />

                {/* 臨時休業（条件付き表示） */}
                {isTemporarilyClosed && (
                    <ActionCard
                        title="臨時休業中"
                        description="営業再開時は設定を更新してください"
                        icon={<AlertCircle className="w-5 h-5 text-destructive" />}
                        href="/settings"
                        variant="warning"
                    />
                )}
            </div>

            {/* クイックアクション */}
            <div className="px-4 py-6 border-t md:border-0 md:p-0 md:mt-8">
                <h2 className="text-lg font-semibold mb-4">クイックアクション</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
                    <Link href="/posts/new">
                        <Card className="transition-all hover:shadow-md active:scale-[0.98] hover:border-primary/50">
                            <CardContent className="p-4 text-center md:py-8">
                                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2 md:mb-4">
                                    <PenSquare className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                                </div>
                                <p className="font-medium md:text-lg">新規投稿</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/settings">
                        <Card className="transition-all hover:shadow-md active:scale-[0.98] hover:border-primary/50">
                            <CardContent className="p-4 text-center md:py-8">
                                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2 md:mb-4">
                                    <Clock className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                                </div>
                                <p className="font-medium md:text-lg">営業時間</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    )
}

function PenSquare({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    )
}

function Clock({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}
