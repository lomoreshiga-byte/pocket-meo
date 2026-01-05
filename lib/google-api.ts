const GBP_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const GBP_PERFORMANCE_BASE = 'https://businessprofileperformance.googleapis.com/v1'

/**
 * 認証ユーザーのGBPアカウント情報を取得
 */
export async function fetchGBPAccounts(accessToken: string) {
    const res = await fetch(`${GBP_API_BASE}/accounts`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!res.ok) {
        const errorText = await res.text()
        console.error(`GBP Accounts API Error: ${res.status}`, errorText)
        throw new Error(`Failed to fetch GBP accounts: ${res.status} ${errorText}`)
    }
    return res.json()
}

/**
 * 指定したアカウントに紐づく店舗（Locations）を取得
 */
export async function fetchGBPLocations(accessToken: string, accountId: string) {
    const res = await fetch(`${GBP_API_BASE}/${accountId}/locations?readMask=name,title,storeCode,metadata`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!res.ok) {
        const errorText = await res.text()
        console.error(`GBP Locations API Error: ${res.status}`, errorText)
        throw new Error(`Failed to fetch GBP locations: ${res.status} ${errorText}`)
    }
    return res.json()
}

/**
 * 店舗のパフォーマンス指標（インサイト）を取得
 * @param locationId 店舗ID (locations/xxxxxxxx)
 * @param dateRange 日付範囲
 */
export async function fetchLocationInsights(accessToken: string, locationId: string, startDate: string, endDate: string) {
    // Daily Metricsの取得
    const url = `${GBP_PERFORMANCE_BASE}/${locationId}:fetchDailyMetrics`
    const metrics = [
        'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
        'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
        'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
        'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
        'WEBSITE_CLICKS',
        'CALL_CLICKS',
        'BUSINESS_DIRECTION_REQUESTS'
    ]
    const queryString = metrics.map(m => `dailyMetric=${m}`).join('&')

    // 日付範囲
    const dateQuery = `dailyRange.startDate.year=${startDate.split('-')[0]}&dailyRange.startDate.month=${startDate.split('-')[1]}&dailyRange.startDate.day=${startDate.split('-')[2]}&dailyRange.endDate.year=${endDate.split('-')[0]}&dailyRange.endDate.month=${endDate.split('-')[1]}&dailyRange.endDate.day=${endDate.split('-')[2]}`

    const res = await fetch(`${url}?${queryString}&${dateQuery}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!res.ok) {
        const errorText = await res.text()
        console.error('GBP Insight Error:', errorText)
        throw new Error('Failed to fetch location insights')
    }

    return res.json()
}
