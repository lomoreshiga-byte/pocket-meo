import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { fetchInstagramMedia } from '@/lib/instagram-api'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        // 1. Get Auth Token from Header
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
        }
        const token = authHeader.replace('Bearer ', '')

        // 2. Validate User and Create Authenticated Client
        // We use the Anon Key but pass the Authorization header so Supabase treats this as an authenticated request.
        // This allows us to rely on RLS (User can read their own data) without needing the Service Role Key.
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: authHeader } } }
        )

        // Verify the user exists (optional, but good for debugging)
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('API Auth Error:', authError)
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // 3. Fetch Integration Token (Using RLS)
        // Fetch both Instagram and Google tokens to return to client (for syncing)
        const { data: integrations, error: dbError } = await supabase
            .from('integrations')
            .select('provider, access_token')
            .eq('user_id', user.id)
            .in('provider', ['instagram', 'google'])

        if (dbError) {
            console.error('DB Error:', dbError)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        const igIntegration = integrations?.find(i => i.provider === 'instagram')
        const googleIntegration = integrations?.find(i => i.provider === 'google')
        const googleToken = googleIntegration?.access_token || null

        if (!igIntegration?.access_token) {
            return NextResponse.json({
                posts: [],
                googleToken,
                instagramToken: null
            })
        }

        // 4. Fetch Instagram Posts
        try {
            const media = await fetchInstagramMedia(igIntegration.access_token)

            const posts = media.map(m => ({
                id: m.id,
                userId: user.id,
                content: m.caption || '',
                imageUrl: m.media_url,
                platform: 'instagram',
                status: 'published',
                publishedAt: m.timestamp,
                createdAt: m.timestamp
            }))

            return NextResponse.json({
                posts,
                googleToken,
                instagramToken: igIntegration.access_token
            })
        } catch (apiError: any) {
            console.error('Instagram API Error:', apiError)
            return NextResponse.json({ error: 'Instagram API Error: ' + apiError.message, googleToken }, { status: 502 })
        }

    } catch (e: any) {
        console.error('Unexpected API Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
