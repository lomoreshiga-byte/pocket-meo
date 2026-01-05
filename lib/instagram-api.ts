export interface InstagramMedia {
    id: string
    caption: string
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
    media_url: string
    permalink: string
    timestamp: string
}

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0'

export async function fetchInstagramMedia(accessToken: string): Promise<InstagramMedia[]> {
    try {
        // 0. 権限の確認 (Debug)
        const permRes = await fetch(`${GRAPH_API_BASE}/me/permissions?access_token=${accessToken}`)
        const permData = await permRes.json()
        const grantedPerms = permData.data?.filter((p: any) => p.status === 'granted').map((p: any) => p.permission).join(', ')
        console.log('Granted Permissions:', grantedPerms)

        const url = `${GRAPH_API_BASE}/me/accounts?fields=instagram_business_account,name,access_token&access_token=${accessToken}`
        // 1. Facebookページと紐付いたInstagramビジネスアカウントIDを取得
        const accountsRes = await fetch(url)

        if (!accountsRes.ok) {
            let errorDetail = ''
            try {
                const err = await accountsRes.json()
                errorDetail = err.error?.message || JSON.stringify(err)
            } catch (e) {
                errorDetail = await accountsRes.text()
            }
            console.error('FB Accounts Error:', errorDetail)
            throw new Error(`FB API Error (${accountsRes.status}): ${errorDetail} | Token: ${accessToken.substring(0, 10)}... | URL: ${url.replace(accessToken, '***')}`)
        }

        const accountsData = await accountsRes.json()

        // instagram_business_accountを持つ最初のページを探す
        const pageWithIg = accountsData.data?.find((page: any) => page.instagram_business_account)

        if (!pageWithIg) {
            console.warn('No connected Instagram Business Account found', accountsData)
            const count = accountsData.data?.length || 0
            const names = accountsData.data?.map((p: any) => p.name).join(', ')
            throw new Error(`リンクされたFacebookページにInstagramビジネスアカウントが見つかりません (検出されたページ: ${names}) (権限: ${grantedPerms})`)
        }

        const igBusinessId = pageWithIg.instagram_business_account.id
        console.log('Found Instagram Business ID:', igBusinessId)

        // 2. Instagramのメディアを取得
        const mediaRes = await fetch(`${GRAPH_API_BASE}/${igBusinessId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url&access_token=${accessToken}`)

        if (!mediaRes.ok) {
            const err = await mediaRes.json()
            console.error('IG Media Error:', err)
            throw new Error(`Failed to fetch IG media: ${err.error?.message}`)
        }

        const mediaData = await mediaRes.json()
        return mediaData.data as InstagramMedia[]

    } catch (error) {
        console.error('fetchInstagramMedia Error:', error)
        throw error
    }
}

export async function fetchInstagramMediaDetails(mediaId: string, accessToken: string): Promise<InstagramMedia | null> {
    try {
        const res = await fetch(`${GRAPH_API_BASE}/${mediaId}?fields=id,caption,media_type,media_url,permalink,timestamp,thumbnail_url&access_token=${accessToken}`)

        if (!res.ok) {
            return null
        }

        const data = await res.json()
        return data as InstagramMedia
    } catch (error) {
        console.error('fetchInstagramMediaDetails Error:', error)
        return null
    }
}
