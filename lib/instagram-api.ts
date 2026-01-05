// Instagram Graph API Endpoints
const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0'

export interface InstagramMedia {
    id: string
    caption: string
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
    media_url: string
    permalink: string
    timestamp: string
}

/**
 * ユーザーのアクセストークンを使って、紐付いているInstagramビジネスアカウントIDを取得する
 * (最も最初に紐付いているページ/アカウントを採用する簡易実装)
 */
export async function fetchInstagramAccountId(accessToken: string): Promise<string | null> {
    try {
        // 1. ユーザーが管理しているFacebookページ一覧を取得
        const pagesRes = await fetch(`${GRAPH_API_BASE}/me/accounts?fields=instagram_business_account&access_token=${accessToken}`)
        if (!pagesRes.ok) throw new Error('Failed to fetch pages')

        const pagesData = await pagesRes.json()

        // 2. instagram_business_accountを持つ最初のページを探す
        for (const page of pagesData.data) {
            if (page.instagram_business_account?.id) {
                return page.instagram_business_account.id
            }
        }

        return null
    } catch (error) {
        console.error('Error fetching Instagram Account ID:', error)
        return null
    }
}

/**
 * 指定したInstagramビジネスアカウントの投稿を取得
 */
export async function fetchInstagramMedia(accessToken: string, instagramAccountId?: string): Promise<InstagramMedia[]> {
    try {
        // IDが指定されていない場合は自動取得を試みる
        let businessId = instagramAccountId
        if (!businessId) {
            businessId = await fetchInstagramAccountId(accessToken) || undefined
        }

        if (!businessId) {
            console.warn('No Instagram Business Account found')
            return []
        }

        // メディア取得
        const res = await fetch(`${GRAPH_API_BASE}/${businessId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url&access_token=${accessToken}`)

        if (!res.ok) {
            const err = await res.json()
            console.error('Instagram Media Fetch Error:', err)
            throw new Error('Failed to fetch media')
        }

        const json = await res.json()

        // 型変換
        return json.data.map((item: any) => ({
            id: item.id,
            caption: item.caption || '',
            media_type: item.media_type,
            // VIDEOの場合はthumbnail_urlを使うフォールバックがあると良いが、今回はmedia_urlのみ
            media_url: item.media_url || item.thumbnail_url || '',
            permalink: item.permalink,
            timestamp: item.timestamp
        }))

    } catch (error) {
        console.error('fetchInstagramMedia error:', error)
        return []
    }
}

export async function fetchInstagramMediaDetails(mediaId: string, accessToken: string): Promise<InstagramMedia | null> {
    try {
        const res = await fetch(`${GRAPH_API_BASE}/${mediaId}?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url&access_token=${accessToken}`)
        if (!res.ok) return null

        const item = await res.json()
        return {
            id: item.id,
            caption: item.caption || '',
            media_type: item.media_type,
            media_url: item.media_url || item.thumbnail_url || '',
            permalink: item.permalink,
            timestamp: item.timestamp
        }
    } catch (error) {
        console.error('fetchInstagramMediaDetails error:', error)
        return null
    }
}
