import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Calendar, AlertCircle, ChevronRight } from 'lucide-react'

interface ActionCardProps {
    title: string
    badge?: number
    href: string
    variant?: 'default' | 'warning'
}

function ActionCard({ title, badge, href, variant = 'default' }: ActionCardProps) {
    return (
        <Link href={href} className="h-full block">
            <Card className={`h-full transition-all hover:shadow-md active:scale-[0.98] ${variant === 'warning' ? 'border-destructive/50 bg-destructive/5' : ''
                }`}>
                <CardHeader className="h-full justify-center">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div>
                                <CardTitle className="text-lg">{title}</CardTitle>
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
            <div className="bg-primary text-primary-foreground pt-safe -mx-4 -mt-4 p-8 pb-10 mb-[-20px] rounded-b-[2rem] shadow-lg md:bg-transparent md:text-foreground md:shadow-none md:rounded-none md:m-0 md:pt-0 md:mb-8">
                <div className="md:p-0">
                    <h1 className="text-2xl font-bold text-center md:text-left">ダッシュボード</h1>
                </div>
            </div>

            {/* アクションカード */}
            <div className="px-4 mt-4 space-y-3 pb-6 md:bg-transparent md:p-0 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
                {/* 未返信クチコミ */}
                <ActionCard
                    title="未返信のクチコミ"
                    badge={unrepliedReviews}
                    href="/reviews"
                />

                {/* 本日の投稿予定 */}
                <ActionCard
                    title="本日の投稿予定"
                    badge={todayPosts}
                    href="/posts"
                />

                {/* 臨時休業（条件付き表示） */}
                {isTemporarilyClosed && (
                    <ActionCard
                        title="臨時休業中"
                        href="/settings"
                        variant="warning"
                    />
                )}
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
