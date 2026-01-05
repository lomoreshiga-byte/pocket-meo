'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { ArrowUpRight, ArrowDownRight, Eye, MousePointerClick, MapPin, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'

interface InsightsData {
    viewsData: any[]
    actionsData: any[]
    totalViews: number
    totalActions: number
    totalDirections: number
}

const mockViewsData = [
    { date: '12/1', map: 450, search: 120 },
    { date: '12/5', map: 480, search: 132 },
    { date: '12/10', map: 510, search: 101 },
    { date: '12/15', map: 520, search: 134 },
    { date: '12/20', map: 460, search: 90 },
    { date: '12/25', map: 610, search: 230 },
    { date: '12/30', map: 580, search: 210 },
]

const mockActionsData = [
    { name: 'ウェブサイト', value: 45 },
    { name: 'ルート検索', value: 120 },
    { name: '通話', value: 28 },
]

const mockData: InsightsData = {
    viewsData: mockViewsData,
    actionsData: mockActionsData,
    totalViews: 3610,
    totalActions: 193,
    totalDirections: 120
}

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<InsightsData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isMock, setIsMock] = useState(false)

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                // セッション取得
                const { data: { session } } = await supabase.auth.getSession()

                // トークンがない、またはAPIエラー時はモックデータを使用
                if (!session?.provider_token) {
                    console.warn('Token not found, using mock data')
                    throw new Error('Token not found')
                }

                // 日付範囲 (過去30日)
                const endDate = new Date()
                const startDate = subDays(endDate, 30)
                const startStr = format(startDate, 'yyyy-MM-dd')
                const endStr = format(endDate, 'yyyy-MM-dd')

                // APIリクエスト
                const res = await fetch(`/api/google/insights?startDate=${startStr}&endDate=${endStr}`, {
                    headers: {
                        Authorization: `Bearer ${session.provider_token}`
                    }
                })

                if (!res.ok) {
                    const errorData = await res.json().catch(() => null)
                    console.warn('API fetch failed, using mock data:', errorData)
                    throw new Error(errorData?.error || 'Failed to fetch')
                }

                const json = await res.json()
                processInsights(json.insights)

            } catch (err: any) {
                console.log('Using mock data due to error:', err)
                setData(mockData)
                setIsMock(true)
            } finally {
                setLoading(false)
            }
        }

        fetchInsights()
    }, [])

    const processInsights = (insights: any) => {
        if (!insights.dailyMetrics) return

        let views = []
        let totalViews = 0
        let totalActions = 0
        let totalDirections = 0
        let websiteClicks = 0
        let callClicks = 0
        let directionRequests = 0

        // 日別データの集計
        for (const dayMetric of insights.dailyMetrics) {
            const date = `${dayMetric.date.month}/${dayMetric.date.day}`
            let map = 0
            let search = 0

            if (dayMetric.dailyMetricValues) {
                for (const val of dayMetric.dailyMetricValues) {
                    const v = parseInt(val.value) || 0

                    if (val.metric.includes('MAPS')) map += v
                    if (val.metric.includes('SEARCH')) search += v

                    if (val.metric === 'WEBSITE_CLICKS') websiteClicks += v
                    if (val.metric === 'CALL_CLICKS') callClicks += v
                    if (val.metric === 'BUSINESS_DIRECTION_REQUESTS') directionRequests += v
                }
            }

            totalViews += (map + search)
            views.push({ date, map, search })
        }

        totalActions = websiteClicks + callClicks + directionRequests
        totalDirections = directionRequests

        const actions = [
            { name: 'ウェブサイト', value: websiteClicks },
            { name: 'ルート検索', value: directionRequests },
            { name: '通話', value: callClicks },
        ]

        setData({
            viewsData: views,
            actionsData: actions,
            totalViews,
            totalActions,
            totalDirections
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Error state is handled by mock fallback, so we don't need explicit error return unless data remains null
    if (!data) return null

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">パフォーマンス分析</h1>
                    <p className="text-muted-foreground">過去30日間のインサイト情報</p>
                </div>
                {isMock && (
                    <div className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-medium border border-amber-200">
                        ※ Google承認待ちのためデモデータを表示中
                    </div>
                )}
            </div>

            {/* 重要指標サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">合計表示回数</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalViews.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">過去30日間</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">反応数 (アクション)</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalActions.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">ウェブサイト・ルート・通話</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ルート検索</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalDirections.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">お店への行き方を検索</p>
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
                                <LineChart data={data.viewsData}>
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
                                <BarChart data={data.actionsData} layout="vertical" margin={{ left: 20 }}>
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
