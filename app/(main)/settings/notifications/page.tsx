'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { LineLogo } from '@/components/icons'

export default function NotificationsPage() {
    const router = useRouter()
    const [isConnected, setIsConnected] = useState(false)

    const handleConnectLine = () => {
        // TODO: Implement LINE Login
        const confirmConnect = confirm('LINE連携を開始しますか？（現状はデモ動作です）')
        if (confirmConnect) {
            setIsConnected(true)
        }
    }

    return (
        <div className="min-h-screen bg-white">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 w-full bg-white border-b border-border/50" style={{ backgroundColor: '#ffffff' }}>
                <div className="pt-safe">
                    <div className="relative flex items-center justify-center h-16 px-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4"
                            onClick={() => router.back()}
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <h1 className="text-xl font-bold text-gray-900">通知設定</h1>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6 pt-6 md:pt-8 md:max-w-2xl md:mx-auto">
                {/* 説明 */}
                <div className="text-center md:text-left">
                    <p className="text-muted-foreground text-sm">
                        クチコミなどの重要なお知らせを受け取る方法を設定します。
                    </p>
                </div>

                {/* LINE連携 */}
                <Card className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <LineLogo className="w-6 h-6" />
                                LINE連携
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                公式LINEアカウントと連携することで、<br className="hidden md:inline" />
                                新しいクチコミが投稿された際にLINEで即時通知を受け取ることができます。
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        {isConnected ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-green-700 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    連携済み
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => setIsConnected(false)}
                                >
                                    解除
                                </Button>
                            </div>
                        ) : (
                            <Button
                                className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold h-12"
                                onClick={handleConnectLine}
                            >
                                <LineLogo className="w-5 h-5 mr-2" />
                                LINEで連携する
                            </Button>
                        )}
                        {!isConnected && (
                            <p className="text-xs text-muted-foreground text-center mt-3">
                                ※ 連携時にはLINEログイン画面が表示されます
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}
