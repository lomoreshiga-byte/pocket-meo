'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Loader2, Instagram } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function IntegrationsPage() {
    const [loading, setLoading] = useState(true)
    const [connecting, setConnecting] = useState(false)
    // 連携状態
    const [isInstagramConnected, setIsInstagramConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        checkConnections()
    }, [])

    const checkConnections = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user?.identities) {
                // Facebook連携があるか確認
                const fbIdentity = session.user.identities.find(
                    (id) => id.provider === 'facebook'
                )
                if (fbIdentity) {
                    setIsInstagramConnected(true)
                }
            }
        } catch (err) {
            console.error('Error checking connections:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleConnectInstagram = async () => {
        setError(null)
        setConnecting(true)
        try {
            // 既存ユーザーにFacebookアカウントをリンク
            const { data, error } = await supabase.auth.linkIdentity({
                provider: 'facebook',
                options: {
                    // Instagram Graph APIに必要なスコープ
                    // instagram_basic: 基本情報取得
                    // pages_show_list: リンクされているFacebookページ取得（ビジネスアカウント特定に必要）
                    // instagram_content_publish: 投稿用
                    scopes: 'instagram_basic,pages_show_list,instagram_content_publish',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: `${window.location.origin}/settings/integrations`
                }
            })

            if (error) throw error

            // リダイレクトされるのでここは実行されない可能性があるが念のため
            if (data) {
                // 成功後の処理（通常はリダイレクト先で判定）
                console.log('Link initiated:', data)
            }

        } catch (err: any) {
            console.error('Error connecting to Instagram:', err)
            setError(err.message || 'Instagramとの連携に失敗しました')
            setConnecting(false)
        }
    }

    const handleDisconnectInstagram = async () => {
        if (!confirm('本当に連携を解除しますか？')) return

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const fbIdentity = session?.user?.identities?.find(id => id.provider === 'facebook')

            if (fbIdentity) {
                const { error } = await supabase.auth.unlinkIdentity(fbIdentity)
                if (error) throw error
                setIsInstagramConnected(false)
            }
        } catch (err: any) {
            console.error('Error disconnecting:', err)
            setError(err.message)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* ヘッダー */}
            <div className="bg-primary text-primary-foreground pt-safe">
                <div className="p-4">
                    <h1 className="text-2xl font-bold">API連携</h1>
                    <p className="text-primary-foreground/80 text-sm mt-1">
                        外部サービスとの連携設定
                    </p>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* Google Business Profile (現状維持) */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Google Business Profile</CardTitle>
                            <Badge variant="default" className="bg-green-600">連携済み</Badge>
                        </div>
                        <CardDescription>
                            店舗情報の管理、クチコミ返信、投稿
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Googleアカウントでログイン中
                        </div>
                    </CardContent>
                </Card>

                {/* Instagram */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Instagram className="w-5 h-5" />
                                Instagram
                            </CardTitle>
                            {isInstagramConnected ? (
                                <Badge variant="default" className="bg-pink-600">連携済み</Badge>
                            ) : (
                                <Badge variant="outline">未連携</Badge>
                            )}
                        </div>
                        <CardDescription>
                            投稿の取得、予約投稿の自動化
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isInstagramConnected ? (
                            <div className="space-y-4">
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-pink-600" />
                                    Instagramアカウントと連携されています
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleDisconnectInstagram}
                                    className="w-full text-destructive hover:text-destructive"
                                >
                                    連携を解除
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Instagramビジネスアカウントと連携するには、Facebookログインが必要です。
                                </p>
                                <Button
                                    onClick={handleConnectInstagram}
                                    disabled={connecting}
                                    className="w-full bg-[#1877F2] hover:bg-[#1864D9] text-white"
                                >
                                    {connecting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            連携中...
                                        </>
                                    ) : (
                                        'Facebookで連携する'
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
