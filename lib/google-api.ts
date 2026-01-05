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

/**
 * 店舗のクチコミを取得 (v4 API)
 * @param accessToken OAuthアクセストークン
 * @param accountId アカウントID (accounts/xxxxxxxx)
 * @param locationId 店舗ID (locations/xxxxxxxx)
 */
export async function fetchGBPReviews(accessToken: string, accountId: string, locationId: string) {
    // locationIdが "locations/" で始まっていない場合は付与
    const formattedLocationId = locationId.startsWith('locations/') ? locationId.split('/')[1] : locationId

    // v4 APIのエンドポイント構築: accounts/{accountId}/locations/{locationId}/reviews
    // accountIdは既に "accounts/" を含んでいることを想定
    const url = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${formattedLocationId}/reviews`

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!res.ok) {
        const errorText = await res.text()
        console.error('GBP Reviews Error:', errorText)
        throw new Error(`Failed to fetch GBP reviews: ${res.status} ${errorText}`)
    }

    return res.json()
}

/**
 * 店舗の検索クエリ（キーワード）インサイトを取得
 * @param accessToken OAuthアクセストークン
 * @param locationId 店舗ID (locations/xxxxxxxx)
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 */
export async function fetchLocationSearchKeywords(accessToken: string, locationId: string, startDate: string, endDate: string) {
    // locationIdが "locations/" で始まっていない場合は付与
    const formattedLocationId = locationId.startsWith('locations/') ? locationId : `locations/${locationId}`

    // GBP Performance API v1 の検索キーワードエンドポイント
    const url = `${GBP_PERFORMANCE_BASE}/${formattedLocationId}:fetchSearchKeywordImpressions`

    // 日付範囲
    // searchKeywordImpressionsのエンドポイントは dailyRange ではなく monthlyRange を要求するドキュメントもあるが、
    // v1の仕様に従い、ここでは日次範囲を指定して試みる（またはドキュメントに準拠したパラメータ構造にする）。
    // NOTE: GBP Performance APIのキーワード取得はパラメータ構造が少し特殊な場合があるため、基本形を使用。
    const dateQuery = `monthlyRange.startMonth.year=${startDate.split('-')[0]}&monthlyRange.startMonth.month=${startDate.split('-')[1]}&monthlyRange.endMonth.year=${endDate.split('-')[0]}&monthlyRange.endMonth.month=${endDate.split('-')[1]}`

    const res = await fetch(`${url}?${dateQuery}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!res.ok) {
        const errorText = await res.text()
        console.error('GBP Search Keywords Error:', errorText)
        // 404や403の場合は空配列を返して画面を壊さないようにする
        if (res.status === 404 || res.status === 403) {
            return { searchKeywordImpressions: [] }
        }
        throw new Error('Failed to fetch search keywords')
    }

    return res.json()
}
