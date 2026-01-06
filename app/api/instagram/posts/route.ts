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

        // 2. Validate User with Standard Client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            console.error('API Auth Error:', authError)
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // 3. Use Admin Client to fetch Integration Token (Bypass RLS)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Fetch both Instagram and Google tokens to return to client (for syncing)
        const { data: integrations, error: dbError } = await supabaseAdmin
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
