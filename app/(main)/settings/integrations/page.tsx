'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function IntegrationsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [connecting, setConnecting] = useState(false)
    const [status, setStatus] = useState({
        gbp: false,
        instagram: false
    })

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // GBP連携状態確認 (gbp_infoがあるかどうか)
                const { data: gbpInfo } = await supabase
                    .from('gbp_info')
                    .select('id')
                    .eq('user_id', user.id)
                    .single()

                // Instagram連携状態確認 (usersテーブルのinstagram_account_id)
                // note: public.usersテーブルが存在し、トリガー設定されている前提
                // もしテーブルがなければエラーになるが、その場合はfalse扱いにする
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('instagram_account_id')
                    .eq('id', user.id)
                    .single()

                setStatus({
                    gbp: !!gbpInfo,
                    instagram: !!userData?.instagram_account_id
                })
            } catch (error) {
                console.error('Error fetching integration status:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStatus()
    }, [])

    const handleConnectInstagram = async () => {
        setConnecting(true)
        // TODO: OAuth認証フローの実装
        // 現時点ではモック動作としてアラートを表示
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert('Instagram連携機能は準備中です。Facebook OAuth認証が必要です。')
        setConnecting(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                読み込み中...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* ヘッダー */}
            <div className="bg-primary text-primary-foreground pt-safe sticky top-0 z-10">
                <div className="p-4 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="text-primary-foreground hover:bg-primary-foreground/10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-bold">API連携設定</h1>
                </div>
            </div>

            <div className="p-4 space-y-6">
                <p className="text-sm text-muted-foreground">
                    各プラットフォームと連携することで、投稿の自動同期や一括管理が可能になります。
                </p>

                {/* Google Business Profile */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🏢</span>
                                <div>
                                    <CardTitle className="text-base">Google Business Profile</CardTitle>
                                    <CardDescription className="text-xs">
                                        Googleマップ上の店舗情報
                                    </CardDescription>
                                </div>
                            </div>
                            {status.gbp ? (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    連携中
                                </Badge>
                            ) : (
                                <Badge variant="secondary">未連携</Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {status.gbp ? (
                            <p className="text-sm text-muted-foreground">
                                クチコミの返信、投稿の公開、営業時間の更新が可能です。
                            </p>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    連携すると、Googleマップの情報をアプリから直接管理できるようになります。
                                </p>
                                <Button variant="outline" className="w-full" disabled>
                                    連携設定を確認
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Instagram */}
                <Card className={!status.instagram ? 'border-primary/50' : ''}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📸</span>
                                <div>
                                    <CardTitle className="text-base">Instagram</CardTitle>
                                    <CardDescription className="text-xs">
                                        写真・動画の共有
                                    </CardDescription>
                                </div>
                            </div>
                            {status.instagram ? (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    連携中
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-primary border-primary">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    未連携
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Instagramの投稿を自動的に取り込み、Googleマップにも同時に投稿できます。
                            </p>

                            {!status.instagram && (
                                <div className="bg-muted/50 p-3 rounded-md">
                                    <h4 className="text-sm font-medium mb-1">メリット</h4>
                                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                        <li>Instagram投稿画像をそのまま利用</li>
                                        <li>アプリを開いたときに自動同期</li>
                                        <li>入力の手間を大幅に削減</li>
                                    </ul>
                                </div>
                            )}

                            {status.instagram ? (
                                <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                                    連携を解除
                                </Button>
                            ) : (
                                <Button
                                    className="w-full"
                                    onClick={handleConnectInstagram}
                                    disabled={connecting}
                                >
                                    {connecting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            接続中...
                                        </>
                                    ) : (
                                        'Instagramと連携する'
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
