import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { publishToInstagram } from '@/lib/instagram'

// Use Edge Runtime for better performance if possible, but Node is safer for heavy requests.
// Let's stick to Node for now to ensure compatibility with all libs if needed.
// export const runtime = 'edge'

export async function POST(request: Request) {
    try {
        // 1. Authenticate Request
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        // Create authenticated Supabase client
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse Body
        const body = await request.json()
        const { content, imageUrl } = body

        if (!imageUrl) {
            // Instagram requires an image for standard posts (Graph API limitation: text-only not supported efficiently for feed)
            return NextResponse.json({ error: 'Image is required for Instagram posts' }, { status: 400 })
        }

        // 3. Get Integration Token
        // Reuse logic from fetching posts: Use the authenticated client (RLS)
        const { data: integration, error: dbError } = await supabase
            .from('integrations')
            .select('access_token, provider_account_id')
            .eq('provider', 'instagram')
            .single()

        if (dbError || !integration || !integration.access_token) {
            return NextResponse.json({ error: 'Instagram not linked or token missing' }, { status: 400 })
        }

        const accessToken = integration.access_token
        // 4. Publish using shared library
        const result = await publishToInstagram(
            accessToken,
            integration.provider_account_id,
            imageUrl,
            content
        )

        return NextResponse.json({
            success: true,
            media_id: result.id,
        })

    } catch (error: any) {
        console.error('Publish API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
