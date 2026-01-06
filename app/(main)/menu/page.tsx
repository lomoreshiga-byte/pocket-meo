'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
    Store,
    ClipboardList,
    Settings,
    ChevronRight,
    HelpCircle,
    LogOut,
    User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function MobileMenuPage() {
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-white pb-20">
            <div className="pt-safe px-6 pb-6 text-center sticky top-0 z-10 bg-white border-b border-border/50" style={{ backgroundColor: '#ffffff' }}>
                <h1 className="text-2xl font-bold text-gray-900">メニュー</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    すべての機能へアクセス
                </p>
            </div>

            <div className="space-y-4 px-4">
                <section>
                    <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-2">店舗運営</h2>
                    <div className="space-y-2">
                        <MenuItem
                            href="/location"
                            icon={<Store className="w-5 h-5 text-blue-500" />}
                            label="店舗情報管理"
                            description="営業時間や基本情報の編集"
                        />
                        <MenuItem
                            href="/surveys"
                            icon={<ClipboardList className="w-5 h-5 text-green-500" />}
                            label="アンケート"
                            description="QRコード表示・口コミ生成"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-2">アカウント・設定</h2>
                    <div className="space-y-2">
                        <MenuItem
                            href="/settings"
                            icon={<Settings className="w-5 h-5 text-slate-500" />}
                            label="設定"
                            description="連携・通知・アカウント情報"
                        />
                        {/* 将来的にヘルプなどを追加可能 */}
                    </div>
                </section>

                <section className="pt-4">
                    <Button
                        variant="outline"
                        className="w-full h-12 text-destructive hover:text-destructive border-red-100 bg-red-50/50 hover:bg-red-50"
                        onClick={handleSignOut}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        ログアウト
                    </Button>
                </section>
            </div>
        </div>
    )
}

function MenuItem({ href, icon, label, description }: { href: string, icon: React.ReactNode, label: string, description: string }) {
    return (
        <Link href={href} className="block">
            <Card className="active:scale-[0.98] transition-transform">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-50 rounded-lg">
                            {icon}
                        </div>
                        <div>
                            <div className="font-bold text-slate-900">{label}</div>
                            <div className="text-xs text-slate-500">{description}</div>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                </CardContent>
            </Card>
        </Link>
    )
}
