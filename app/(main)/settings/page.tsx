'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // ユーザー情報の取得
                const { data: { user } } = await supabase.auth.getUser()
                if (user?.email) {
                    setEmail(user.email)
                }
            } catch (error) {
                console.error('Error loading settings:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center">読み込み中...</div>
    }

    return (
        <div className="min-h-screen bg-white">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 w-full bg-white border-b border-border/50" style={{ backgroundColor: '#ffffff' }}>
                <div className="pt-safe">
                    <div className="flex items-center justify-center h-16 px-6">
                        <h1 className="text-xl font-bold text-gray-900">設定</h1>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6 pt-6 md:pt-8 bg-white">
                <div className="text-center md:text-left mb-6">
                    <p className="text-muted-foreground text-sm">
                        店舗情報と連携設定
                    </p>
                </div>
                {/* アカウント情報 */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">アカウント</h2>

                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">メールアドレス</p>
                                <p className="text-sm font-medium">{email}</p>
                            </div>

                            <div className="pt-3 border-t">
                                <p className="text-sm text-muted-foreground mb-2">連携状況</p>
                                <div className="flex gap-2">
                                    <Badge variant="default">Google</Badge>
                                    <Badge variant="outline">GBP 未連携</Badge>
                                    <Badge variant="outline">Instagram 未連携</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 詳細設定 */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">詳細設定</h2>

                    <div className="space-y-4">
                        <SettingItem
                            label="API連携"
                            description="GBP、Instagram、Gemini"
                            href="/settings/integrations"
                        />
                        <SettingItem
                            label="通知設定"
                            description="プッシュ通知、メール通知"
                            href="/settings/notifications"
                        />
                    </div>
                </section>

                {/* ログアウト */}
                <section className="pb-6">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full h-12 text-destructive hover:text-destructive"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        ログアウト
                    </Button>
                </section>
            </div>
        </div>
    )
}

function SettingItem({
    label,
    description,
    href,
}: {
    label: string
    description: string
    href: string
}) {
    return (
        <Link href={href} className="block">
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">{label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {description}
                            </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
