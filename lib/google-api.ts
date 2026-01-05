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

const GBP_POSTS_BASE = 'https://mybusinesslocalposts.googleapis.com/v1'

/**
 * Googleビジネスプロフィールに投稿を作成
 * @param accessToken OAuthアクセストークン
 * @param locationId 店舗ID (locations/xxxxxxxx)
 * @param content 投稿本文
 * @param imageUrl 画像URL (任意)
 */
export async function createGBPPost(accessToken: string, locationId: string, content: string, imageUrl?: string) {
    // locationIdが "locations/" で始まっていない場合は付与
    const formattedLocationId = locationId.startsWith('locations/') ? locationId : `locations/${locationId}`
    const url = `${GBP_POSTS_BASE}/${formattedLocationId}/localPosts`

    const body: any = {
        summary: content,
        topicType: 'STANDARD', // 標準の投稿
        // languageCode: 'ja', // 必要に応じて
    }

    if (imageUrl) {
        body.media = [
            {
                mediaFormat: 'PHOTO',
                sourceUrl: imageUrl,
            }
        ]
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const errorText = await res.text()
        console.error('GBP Create Post Error:', errorText)
        throw new Error(`Failed to create GBP post: ${res.status} ${errorText}`)
    }

    return res.json()
}
