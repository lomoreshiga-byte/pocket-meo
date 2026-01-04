'use client'

import { useState } from 'react'
import { signInWithGoogle } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chrome } from 'lucide-react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)

    const handleGoogleLogin = async () => {
        console.log('ログインボタンがクリックされました')
        setLoading(true)

        try {
            console.log('signInWithGoogle を呼び出し中...')
            const { data, error } = await signInWithGoogle()

            console.log('認証結果:', { data, error })

            if (error) {
                console.error('Login error:', error)
                alert('ログインに失敗しました: ' + error.message)
                setLoading(false)
            } else {
                console.log('認証成功！リダイレクト待ち...')
            }
        } catch (err) {
            console.error('予期しないエラー:', err)
            alert('予期しないエラーが発生しました')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
                        <Star className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-3xl font-bold">Pocket MEO</CardTitle>
                    <CardDescription className="text-base">
                        スマホで3秒で返信、5秒で投稿
                        <br />
                        シンプルなMEO管理ツール
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full h-12 text-base"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ログイン中...
                            </>
                        ) : (
                            <>
                                <Chrome className="w-5 h-5 mr-2" />
                                Googleでログイン
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

function Star({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    )
}
