import { NextResponse } from 'next/server'
import { fetchGBPAccounts, fetchGBPLocations, fetchLocationInsights } from '@/lib/google-api'

export async function GET(request: Request) {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = authHeader.replace('Bearer ', '')
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') // YYYY-MM-DD
    const endDate = searchParams.get('endDate') // YYYY-MM-DD

    if (!startDate || !endDate) {
        // デフォルト: 過去30日間
        // ここではエラーにする
        return NextResponse.json({ error: 'Date range required' }, { status: 400 })
    }

    try {
        // 1. アカウント一覧取得
        const accountsData = await fetchGBPAccounts(accessToken)
        if (!accountsData.accounts || accountsData.accounts.length === 0) {
            return NextResponse.json({ error: 'No GBP accounts found' }, { status: 404 })
        }

        // 最初のビジネスアカウントを使用
        const accountId = accountsData.accounts[0].name // accounts/xxxxxxxx

        // 2. 店舗一覧取得
        const locationsData = await fetchGBPLocations(accessToken, accountId)
        if (!locationsData.locations || locationsData.locations.length === 0) {
            return NextResponse.json({ error: 'No locations found' }, { status: 404 })
        }

        // 最初の店舗を使用 (複数店舗対応は将来的に)
        const location = locationsData.locations[0]
        const locationId = location.name // locations/xxxxxxxx

        // 3. インサイト取得
        const insights = await fetchLocationInsights(accessToken, locationId, startDate, endDate)

        return NextResponse.json({
            location: {
                title: location.title,
                storeCode: location.storeCode,
            },
            insights: insights
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
