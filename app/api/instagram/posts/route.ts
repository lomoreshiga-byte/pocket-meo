import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Similar logic: fetch token from 'integrations' table or session
    const providerToken = session.provider_token

    if (!providerToken) {
        // Fallback mock data
        return NextResponse.json({
            data: [
                {
                    id: 'ig1',
                    media_type: 'IMAGE',
                    media_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
                    caption: '今日のランチは特製ラーメン！',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 'ig2',
                    media_type: 'IMAGE',
                    media_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
                    caption: '新メニューの試作中です。',
                    timestamp: new Date(Date.now() - 86400000).toISOString()
                }
            ]
        })
    }

    try {
        // Facebook Graph API to get Instagram Media
        // Need Page ID -> IG User ID -> Media
        const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${providerToken}`)
        const data = await response.json()

        // Complex logic omitted: Traverse to find IG Business ID and then fetch media
        // For now, returning mock to ensure UI works
        return NextResponse.json({
            data: [
                {
                    id: 'ig1',
                    media_type: 'IMAGE',
                    media_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
                    caption: 'APIからの取得データ（デモ）',
                    timestamp: new Date().toISOString()
                }
            ]
        })

    } catch (error) {
        console.error('Instagram API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }
}
