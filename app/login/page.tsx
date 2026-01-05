'use client'

import { useState } from 'react'
import { signInWithGoogle, signInWithFacebook } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chrome } from 'lucide-react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)

    const handleGoogleLogin = async () => {
        setLoading(true)
        try {
            const { error } = await signInWithGoogle()
            if (error) throw error
        } catch (err: any) {
            console.error('Login error:', err)
            alert('ログインに失敗しました: ' + err.message)
            setLoading(false)
        }
    }

    const handleFacebookLogin = async () => {
        setLoading(true)
        try {
            const { error } = await signInWithFacebook()
            if (error) throw error
        } catch (err: any) {
            console.error('Login error:', err)
            alert('ログインに失敗しました: ' + err.message)
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
                        スマホでできるMEO対策
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

                    <Button
                        onClick={handleFacebookLogin}
                        disabled={loading}
                        className="w-full h-12 text-base bg-[#1877F2] hover:bg-[#1864D9]"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ログイン中...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                Facebookでログイン
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
