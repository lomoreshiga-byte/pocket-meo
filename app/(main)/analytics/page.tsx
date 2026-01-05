'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { ArrowUpRight, ArrowDownRight, Eye, MousePointerClick, MapPin } from 'lucide-react'

// モックデータ (検索・マップ表示回数)
const viewsData = [
    { date: '12/1', search: 120, map: 450 },
    { date: '12/5', search: 132, map: 480 },
    { date: '12/10', search: 101, map: 510 },
    { date: '12/15', search: 134, map: 520 },
    { date: '12/20', search: 90, map: 460 },
    { date: '12/25', search: 230, map: 610 },
    { date: '12/30', search: 210, map: 580 },
]

// モックデータ (アクション数)
const actionsData = [
    { name: 'ウェブサイト', value: 45 },
    { name: 'ルート検索', value: 120 },
    { name: '通話', value: 28 },
]

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">パフォーマンス分析</h1>
                <p className="text-muted-foreground">過去30日間のインサイト情報</p>
            </div>

            {/* 重要指標サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">合計表示回数</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3,610</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-emerald-500 flex items-center mr-1">
                                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                +12.3%
                            </span>
                            先月比
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">反応数 (アクション)</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">193</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-emerald-500 flex items-center mr-1">
                                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                +5.1%
                            </span>
                            先月比
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ルート検索</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">120</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-rose-500 flex items-center mr-1">
                                <ArrowDownRight className="h-3 w-3 mr-0.5" />
                                -2.4%
                            </span>
                            先月比
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 表示回数推移グラフ */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>検索・マップ表示回数の推移</CardTitle>
                        <CardDescription>
                            お客様がGoogleでお店を見つけた回数
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={viewsData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="map" name="Googleマップ" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="search" name="Google検索" stroke="#16a34a" strokeWidth={2} activeDot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* アクション内訳グラフ */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>ユーザーの反応 (アクション)</CardTitle>
                        <CardDescription>
                            プロフィールを見た後の行動内訳
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={actionsData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
