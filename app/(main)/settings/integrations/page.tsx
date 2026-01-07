'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function IntegrationsPage() {
    const [loading, setLoading] = useState(true)
    const [instagramLinked, setInstagramLinked] = useState(false)
    const [googleLinked, setGoogleLinked] = useState(false)
    const [linking, setLinking] = useState(false)
    const [statusMessage, setStatusMessage] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        checkConnection()

        // Listen for auth changes (Implicit flow redirect will trigger SIGNED_IN or USER_UPDATED)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth Event:', event)

            // Check if we are in the middle of linking
            const isLinkingIg = localStorage.getItem('linking_instagram') === 'true'
            const isLinkingGoogle = localStorage.getItem('linking_google') === 'true'

            if (session?.provider_token) {
                // Determine which provider this token is for
                // Supabase doesn't explicitly say "this token is for provider X" in the session object easily
                // BUT we can infer it or just try to save to the one we are linking.
                const user = session.user

                if (isLinkingIg) {
                    // ... Instagram logic (existing) ...
                    // (Keep existing IG logic here, just indented)
                    setStatusMessage('Instagramトークンを検出しました！保存しています...')
                    setLinking(true)
                    try {
                        const fbIdentity = user.identities?.find(i => i.provider === 'facebook')

                        // Fetch the correct Instagram Business Account ID
                        const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account&access_token=${session.provider_token}`)
                        const pagesData = await pagesRes.json()
                        // ... (Rest of IG logic)
                        if (pagesData.error) throw new Error('Facebook Pages Fetch Error: ' + pagesData.error.message)
                        const pageWithIg = pagesData.data?.find((p: any) => p.instagram_business_account?.id)
                        const instagramAccountId = pageWithIg?.instagram_business_account?.id
                        if (!instagramAccountId) throw new Error('リンクされたInstagramビジネスアカウントが見つかりません。')

                        const { error } = await supabase.from('integrations').upsert({
                            user_id: user.id,
                            provider: 'instagram',
                            provider_account_id: fbIdentity?.id || 'unknown', // Server resolves real ID
                            access_token: session.provider_token,
                            refresh_token: session.provider_refresh_token,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id, provider' })

                        if (error) throw error
                        localStorage.removeItem('linking_instagram')
                        setInstagramLinked(true)
                        setStatusMessage('Instagram保存成功！')
                        alert('Instagram連携が完了しました！')
                        window.history.replaceState(null, '', window.location.pathname)
                    } catch (err: any) {
                        console.error(err)
                        setError('Instagram連携エラー: ' + err.message)
                    } finally {
                        setLinking(false)
                    }

                } else if (isLinkingGoogle) {
                    // Google Logic
                    setStatusMessage('Googleトークンを検出しました！保存しています...')
                    setLinking(true)
                    try {
                        // For Google, simply save the token. 
                        // We will resolve Account/Location dynamically on the server API side.
                        const { error } = await supabase.from('integrations').upsert({
                            user_id: user.id,
                            provider: 'google',
                            provider_account_id: 'auto_resolving', // Placeholder
                            access_token: session.provider_token,
                            refresh_token: session.provider_refresh_token,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id, provider' })

                        if (error) throw error
                        localStorage.removeItem('linking_google')
                        setGoogleLinked(true)
                        setStatusMessage('Google保存成功！')
                        alert('Google連携が完了しました！')
                        window.history.replaceState(null, '', window.location.pathname)
                    } catch (err: any) {
                        console.error(err)
                        setError('Google連携エラー: ' + err.message)
                    } finally {
                        setLinking(false)
                    }
                }
            } else if (isLinkingIg && event === 'SIGNED_IN' && !session?.provider_token) {
                // Signed in by redirect but no token? (Maybe existing session used?)
                console.warn('Redirected back but no token found in session object for Instagram')
                // Don't clear flag yet, maybe next event has it?
            } else if (isLinkingGoogle && event === 'SIGNED_IN' && !session?.provider_token) {
                console.warn('Redirected back but no token found in session object for Google')
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const checkConnection = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                const user = session.user
                // Check Instagram
                const fbIdentity = user.identities?.find(i => i.provider === 'facebook')
                const { data: igInt } = await supabase.from('integrations').select('id').eq('user_id', user.id).eq('provider', 'instagram').single()
                setInstagramLinked(!!fbIdentity && !!igInt)

                // Check Google
                // For Google, we look for 'integration' row with provider='google'
                const { data: googleInt } = await supabase.from('integrations').select('id').eq('user_id', user.id).eq('provider', 'google').single()
                setGoogleLinked(!!googleInt)
            }
        } catch (err) {
            console.error('Error checking connection:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleConnectGoogle = async () => {
        setLinking(true)
        setError(null)
        localStorage.setItem('linking_google', 'true')
        try {
            // Re-authenticate with Google/Update scopes
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    scopes: 'https://www.googleapis.com/auth/business.manage',
                    queryParams: {
                        access_type: 'offline', // Important for refresh token
                        prompt: 'consent',
                    },
                    redirectTo: `${window.location.origin}/settings/integrations`
                }
            })
            if (error) throw error
        } catch (err: any) {
            console.error('Google connect error:', err)
            setError(err.message)
            setLinking(false)
            localStorage.removeItem('linking_google')
        }
    }

    const handleDisconnectGoogle = async () => {
        if (!confirm('Google連携を解除しますか？')) return
        setLinking(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from('integrations').delete().eq('user_id', user.id).eq('provider', 'google')
                setGoogleLinked(false)
                alert('Google連携を解除しました')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLinking(false)
        }
    }

    const handleConnectInstagram = async () => {
        setLinking(true)
        setError(null)
        // Set flag to expect return
        localStorage.setItem('linking_instagram', 'true')

        try {
            // 既存ユーザーにFacebookアカウントを紐付け (Link Identity)
            const { data, error } = await supabase.auth.linkIdentity({
                provider: 'facebook',
                options: {
                    scopes: 'instagram_basic,pages_show_list,instagram_content_publish',
                    redirectTo: `${window.location.origin}/settings/integrations` // Implicit flow
                }
            })

            if (error) throw error
        } catch (err: any) {
            console.error('Instagram connection error:', err)
            setError(err.message || '連携に失敗しました')
            setLinking(false)
            localStorage.removeItem('linking_instagram')
        }
    }

    const handleDisconnectInstagram = async () => {
        if (!confirm('Instagram連携を解除しますか？\n解除した後、再度「連携する」ボタンを押して再接続してください。')) return
        setLinking(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // 1. Unlink Identity
            const fbIdentity = session.user.identities?.find(i => i.provider === 'facebook')
            if (fbIdentity) {
                const { error } = await supabase.auth.unlinkIdentity(fbIdentity)
                if (error) throw error
            }

            // 2. Delete from integrations table
            await supabase
                .from('integrations')
                .delete()
                .eq('user_id', session.user.id)
                .eq('provider', 'instagram')

            // 3. Refresh session to ensure identity is gone locally
            await supabase.auth.refreshSession()

            // 4. Update UI immediately
            setInstagramLinked(false)
            alert('連携を解除しました。再度「Instagramと連携する」ボタンを押してください。')

        } catch (err: any) {
            console.error('Unlink error:', err)
            setError('連携解除に失敗しました: ' + err.message)
        } finally {
            setLinking(false)
        }
    }

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center">読み込み中...</div>
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-primary text-primary-foreground pt-safe">
                <div className="p-4">
                    <h1 className="text-2xl font-bold">API連携設定</h1>
                    <p className="text-primary-foreground/80 text-sm mt-1">
                        外部サービスとの接続を管理します
                    </p>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Google Business Profile */}
                {/* Google Business Profile */}
                <section>
                    <Card className={googleLinked ? 'border-green-500/50' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-100">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">Google ビジネス</CardTitle>
                                        <CardDescription className="text-sm">
                                            {googleLinked ? '連携済み' : '未連携'}
                                        </CardDescription>
                                    </div>
                                </div>
                                {googleLinked && <Badge variant="default" className="bg-green-600">連携中</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Googleマップ（ビジネスプロフィール）に投稿したり、クチコミを取得するために連携が必要です。
                                </p>

                                {!googleLinked ? (
                                    <Button
                                        onClick={handleConnectGoogle}
                                        disabled={linking}
                                        className="w-full bg-[#4285F4] hover:bg-[#3367D6]"
                                    >
                                        {linking && localStorage.getItem('linking_google') ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                接続中...
                                            </>
                                        ) : (
                                            'Googleと連携する'
                                        )}
                                    </Button>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>正常に接続されています</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={handleDisconnectGoogle}
                                            disabled={linking}
                                        >
                                            {linking ? '解除中...' : '連携を解除して再接続する'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Instagram */}
                <section>
                    <Card className={instagramLinked ? 'border-green-500/50' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-pink-100">
                                        <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">Instagram / Facebook</CardTitle>
                                        <CardDescription className="text-sm">
                                            {instagramLinked ? '連携済み' : '未連携'}
                                        </CardDescription>
                                    </div>
                                </div>
                                {instagramLinked && <Badge variant="default" className="bg-green-600">連携中</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Status Feedback */}
                            {statusMessage && (
                                <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm font-bold animate-pulse">
                                    {statusMessage}
                                </div>
                            )}

                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Instagramの投稿を取得したり、予約投稿を行うために連携が必要です。
                                    FacebookページとリンクされたInstagramアカウントが必要です。
                                </p>

                                {error && (
                                    <div className="p-3 rounded-md bg-destructive/10 flex items-start gap-2 text-sm text-destructive">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {!instagramLinked ? (
                                    <Button
                                        onClick={handleConnectInstagram}
                                        disabled={linking}
                                        className="w-full bg-[#1877F2] hover:bg-[#1864D9]"
                                    >
                                        {linking ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                接続中...
                                            </>
                                        ) : (
                                            'Instagramと連携する'
                                        )}
                                    </Button>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>正常に接続されています</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={handleDisconnectInstagram}
                                            disabled={linking}
                                        >
                                            {linking ? '解除中...' : '連携を解除して再接続する'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            連携できない場合
                        </h4>
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                            <li>Instagramがプロアカウント（ビジネス/クリエイター）になっているか確認してください</li>
                            <li>InstagramとFacebookページが正しくリンクされているか確認してください</li>
                            <li>「設定 &gt; ビジネス向けFacebookログイン」を選択して許可してください</li>
                        </ul>
                        <a
                            href="https://www.facebook.com/business/help/connect-instagram-to-page"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                            設定方法のヘルプを見る <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </section>
            </div>
        </div>
    )
}
