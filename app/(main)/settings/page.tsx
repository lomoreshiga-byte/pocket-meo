'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Clock, AlertCircle, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
    const [isTemporarilyClosed, setIsTemporarilyClosed] = useState(false)
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // ユーザー情報の取得
                const { data: { user } } = await supabase.auth.getUser()
                if (user?.email) {
                    setEmail(user.email)
                }

                // GBP情報の取得
                const { data: gbpInfo, error } = await supabase
                    .from('gbp_info')
                    .select('is_temporarily_closed')
                    .eq('user_id', user?.id)
                    .single()

                if (error && error.code !== 'PGRST116') { // PGRST116: data not found
                    console.error('Error fetching GBP info:', error)
                }

                if (gbpInfo) {
                    setIsTemporarilyClosed(gbpInfo.is_temporarily_closed)
                }
            } catch (error) {
                console.error('Error loading settings:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleToggleClosed = async () => {
        const newValue = !isTemporarilyClosed
        setIsTemporarilyClosed(newValue)
        setUpdating(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // まず既存のレコードを確認
            const { data: existingData } = await supabase
                .from('gbp_info')
                .select('id')
                .eq('user_id', user.id)
                .single()

            let error;

            if (existingData) {
                // 更新
                const { error: updateError } = await supabase
                    .from('gbp_info')
                    .update({
                        is_temporarily_closed: newValue,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id)
                error = updateError
            } else {
                // 新規作成
                const { error: insertError } = await supabase
                    .from('gbp_info')
                    .insert({
                        user_id: user.id,
                        is_temporarily_closed: newValue,
                        updated_at: new Date().toISOString()
                    })
                error = insertError
            }

            if (error) {
                console.error('Error updating status:', error)
                // エラー時は戻す
                setIsTemporarilyClosed(!newValue)
            }
        } catch (error) {
            console.error('Error updating status:', error)
            setIsTemporarilyClosed(!newValue)
        } finally {
            setUpdating(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center">読み込み中...</div>
    }

    return (
        <div className="min-h-screen bg-background">
            {/* ヘッダー */}
            <div className="bg-primary text-primary-foreground pt-safe">
                <div className="p-4">
                    <h1 className="text-2xl font-bold">設定</h1>
                    <p className="text-primary-foreground/80 text-sm mt-1">
                        店舗情報と連携設定
                    </p>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* クイック設定 */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">クイック設定</h2>

                    {/* 臨時休業 */}
                    <Card className={isTemporarilyClosed ? 'border-destructive/50' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isTemporarilyClosed ? 'bg-destructive/10' : 'bg-muted'
                                        }`}>
                                        <AlertCircle className={`w-5 h-5 ${isTemporarilyClosed ? 'text-destructive' : 'text-muted-foreground'
                                            }`} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">臨時休業</CardTitle>
                                        <CardDescription className="text-sm">
                                            {isTemporarilyClosed ? '現在休業中です' : '通常営業中'}
                                            {updating && <span className="ml-2 text-xs text-muted-foreground">(更新中...)</span>}
                                        </CardDescription>
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggleClosed}
                                    disabled={updating}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTemporarilyClosed ? 'bg-destructive' : 'bg-muted'
                                        } ${updating ? 'opacity-50' : ''}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTemporarilyClosed ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* 営業時間 */}
                    <Link href="/settings/hours">
                        <Card className="mt-3 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-muted">
                                            <Clock className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">営業時間</CardTitle>
                                            <CardDescription className="text-sm">
                                                平日 9:00 - 18:00
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                </section>

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

                    <div className="space-y-2">
                        <SettingItem
                            label="店舗情報"
                            description="住所、電話番号、カテゴリ"
                            href="/settings/business-info"
                        />
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
        <Link href={href}>
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
