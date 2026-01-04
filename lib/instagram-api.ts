export interface InstagramMedia {
    id: string
    caption: string
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
    media_url: string
    permalink: string
    timestamp: string
}

// モックデータ: 本来はInstagram Graph APIから取得する
const MOCK_INSTAGRAM_MEDIA: InstagramMedia[] = [
    {
        id: '17928374650123456',
        caption: '新作のカプチーノです☕️\n#カフェ #コーヒー #ラテアート',
        media_type: 'IMAGE',
        media_url: '/mock-instagram-1.jpg', // プレースホルダー画像
        permalink: 'https://www.instagram.com/p/mock1/',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1日前
    },
    {
        id: '17928374650123457',
        caption: '春の限定メニュー、桜もちパンケーキ🌸\n来週からスタートです！',
        media_type: 'IMAGE',
        media_url: '/mock-instagram-2.jpg',
        permalink: 'https://www.instagram.com/p/mock2/',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3時間前
    }
]

export async function fetchInstagramMedia(accessToken: string): Promise<InstagramMedia[]> {
    // 実際のAPIコールの代わりにモックデータを返す
    // 本番では: https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=...
    console.log('Fetching Instagram media with token:', accessToken)

    // ネットワーク遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 800))

    return MOCK_INSTAGRAM_MEDIA
}

export async function fetchInstagramMediaDetails(mediaId: string, accessToken: string): Promise<InstagramMedia | null> {
    console.log('Fetching media details for:', mediaId)
    // モック: IDが一致するものを探す（なければ適当なものを返す）
    const media = MOCK_INSTAGRAM_MEDIA.find(m => m.id === mediaId)
    return media || {
        id: mediaId,
        caption: '自動連携された投稿です✨',
        media_type: 'IMAGE',
        media_url: '/mock-instagram-1.jpg',
        permalink: `https://www.instagram.com/p/${mediaId}/`,
        timestamp: new Date().toISOString()
    }
}
