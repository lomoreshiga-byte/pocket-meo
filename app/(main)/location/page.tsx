'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Clock, MapPin, Globe, Phone, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function LocationPage() {
    const [loading, setLoading] = useState(false)
    const [isClosedTemporarily, setIsClosedTemporarily] = useState(false)

    // Mock Data
    const [formData, setFormData] = useState({
        locationName: 'Pocket Cafe 渋谷店',
        address: '東京都渋谷区道玄坂1-2-3',
        phone: '03-1234-5678',
        website: 'https://example.com'
    })

    const handleSave = async () => {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setLoading(false)
        toast.success('店舗情報を更新しました')
    }

    return (
        <div className="min-h-screen bg-white pb-20">
            <div className="pt-safe px-6 pb-6 sticky top-0 z-10 bg-white border-b border-border/50" style={{ backgroundColor: '#ffffff' }}>
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">店舗情報管理</h1>
                    <p className="text-muted-foreground">
                        Googleマップに表示される店舗情報の確認・編集ができます。
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-6">

                {/* 緊急対応: 臨時休業 */}
                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-5 h-5" />
                            <CardTitle className="text-lg">臨時休業設定</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">現在「営業中」として表示されています</Label>
                                <p className="text-sm text-muted-foreground">
                                    急な休業の際にONにすると、Googleマップ上で「臨時休業」と表示されます。
                                </p>
                            </div>
                            <Switch
                                checked={isClosedTemporarily}
                                onCheckedChange={setIsClosedTemporarily}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="basic" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="basic">基本情報</TabsTrigger>
                        <TabsTrigger value="hours">営業時間</TabsTrigger>
                        {/* <TabsTrigger value="photos">写真</TabsTrigger> */}
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6 pb-20">
                        <Card>
                            <CardHeader>
                                <CardTitle>基本情報</CardTitle>
                                <CardDescription>
                                    店舗の基本情報を編集します。変更はGoogleマップに反映されます。
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>店舗名</Label>
                                    <div className="flex items-center gap-2">
                                        <StoreIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <Input
                                            value={formData.locationName}
                                            onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>住所</Label>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <Input
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>電話番号</Label>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>ウェブサイト</Label>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <Input
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button onClick={handleSave} disabled={loading} className="gap-2">
                                        {loading ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                                        変更を保存
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="hours" className="pb-20">
                        <Card>
                            <CardHeader>
                                <CardTitle>営業時間</CardTitle>
                                <CardDescription>
                                    通常の営業時間を設定します。
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {['月', '火', '水', '木', '金', '土', '日'].map((day) => (
                                    <div key={day} className="flex items-center justify-between py-2 border-b last:border-0">
                                        <div className="w-20 font-medium">{day}曜日</div>
                                        <div className="flex items-center gap-2 flex-1 justify-end sm:justify-start sm:pl-10">
                                            <Input type="time" className="w-32" defaultValue="10:00" />
                                            <span className="text-muted-foreground">~</span>
                                            <Input type="time" className="w-32" defaultValue="20:00" />
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4">
                                    <Button onClick={handleSave} disabled={loading} className="gap-2">
                                        {loading ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                                        営業時間を保存
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

function StoreIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
        </svg>
    )
}
