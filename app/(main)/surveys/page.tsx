'use client'

import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, Share, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SurveyDashboardPage() {
    const [surveyUrl, setSurveyUrl] = useState('')

    useEffect(() => {
        // クライアントサイドでURLを生成
        if (typeof window !== 'undefined') {
            const url = `${window.location.origin}/s`
            setSurveyUrl(url)
        }
    }, [])

    const copyUrl = () => {
        navigator.clipboard.writeText(surveyUrl)
        toast.success('URLをコピーしました')
    }

    const printPage = () => {
        window.print()
    }

    return (
        <div className="min-h-screen bg-white pb-20">
            <div className="pt-safe px-6 pb-6 sticky top-0 z-10 bg-white border-b border-border/50" style={{ backgroundColor: '#ffffff' }}>
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">アンケート管理</h1>
                    <p className="text-muted-foreground">
                        お客様に以下のQRコードを読み取っていただくことで、AIによる口コミ生成機能を提供できます。
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-6">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* QRコードカード */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>店頭用QRコード</CardTitle>
                            <CardDescription>
                                このQRコードを印刷して、テーブルやレジ横に設置してください。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 flex flex-col items-center gap-6">
                            <div className="bg-white p-4 rounded-xl border-4 border-slate-900 shadow-sm">
                                {surveyUrl ? (
                                    <QRCode
                                        value={surveyUrl}
                                        size={200}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        viewBox={`0 0 256 256`}
                                    />
                                ) : (
                                    <div className="w-[200px] h-[200px] bg-slate-100 animate-pulse rounded-md" />
                                )}
                            </div>

                            <div className="text-center space-y-1">
                                <p className="font-bold text-lg">アンケートにご協力ください</p>
                                <p className="text-sm text-muted-foreground">カメラで読み取って回答を作成</p>
                            </div>

                            <div className="flex w-full gap-3 mt-2 print:hidden">
                                <Button className="flex-1 gap-2" variant="outline" onClick={printPage}>
                                    <Printer className="w-4 h-4" />
                                    印刷する
                                </Button>
                                {/* <Button className="flex-1 gap-2" disabled>
                                    <Share className="w-4 h-4" />
                                    シェア
                                </Button> */}
                            </div>
                        </CardContent>
                    </Card>

                    {/* URL共有カード */}
                    <Card>
                        <CardHeader>
                            <CardTitle>直接リンク</CardTitle>
                            <CardDescription>
                                SNSやメールで送る場合はこちらのURLを使用してください。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>アンケートURL</Label>
                                <div className="flex gap-2">
                                    <Input value={surveyUrl} readOnly className="bg-slate-50 font-mono" />
                                    <Button size="icon" variant="outline" onClick={copyUrl}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-medium mb-2">活用アドバイス</h3>
                                <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                                    <li>お会計時のレシートと一緒にQRコードを渡す</li>
                                    <li>各テーブルにPOPとして設置する</li>
                                    <li>LINE公式アカウントのリッチメニューにリンクを設定する</li>
                                </ul>
                            </div>

                            <div className="pt-4">
                                <Button variant="link" className="p-0 h-auto gap-1 text-blue-600" asChild>
                                    <a href="/s" target="_blank" rel="noopener noreferrer">
                                        実際の画面を確認する <ExternalLink className="w-3 h-3" />
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
