import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
        // Note: provider_account_id in DB *might* be the Facebook User ID (implicit auth).
        // We must ensure we have the Instagram Business Account ID.
        // Let's resolve it dynamically using the token to be safe.

        let accountId = integration.provider_account_id

        // Fetch user's pages to find the connected IG account
        // This is robust: even if DB has wrong ID, this fixes it for the call.
        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts`
        const pagesParams = new URLSearchParams({
            fields: 'instagram_business_account',
            access_token: accessToken
        })

        const pagesRes = await fetch(`${pagesUrl}?${pagesParams.toString()}`)
        const pagesData = await pagesRes.json()

        if (!pagesData.error && pagesData.data) {
            const pageWithIg = pagesData.data.find((p: any) => p.instagram_business_account?.id)
            if (pageWithIg?.instagram_business_account?.id) {
                accountId = pageWithIg.instagram_business_account.id
            }
        }

        // If we still don't have a valid-looking ID, posting might fail, but let's try.

        // 4. Instagram Graph API
        // Step A: Create Media Container
        const containerUrl = `https://graph.facebook.com/v19.0/${accountId}/media`
        const containerParams = new URLSearchParams({
            image_url: imageUrl,
            caption: content || '',
            access_token: accessToken
        })

        const containerRes = await fetch(`${containerUrl}?${containerParams.toString()}`, { method: 'POST' })
        const containerData = await containerRes.json()

        if (containerData.error) {
            console.error('IG Container Error:', containerData.error)
            throw new Error(`Instagram API Error (Create): ${containerData.error.message}`)
        }

        const creationId = containerData.id

        // Step B: Publish Media
        const publishUrl = `https://graph.facebook.com/v19.0/${accountId}/media_publish`
        const publishParams = new URLSearchParams({
            creation_id: creationId,
            access_token: accessToken
        })

        const publishRes = await fetch(`${publishUrl}?${publishParams.toString()}`, { method: 'POST' })
        const publishData = await publishRes.json()

        if (publishData.error) {
            console.error('IG Publish Error:', publishData.error)
            throw new Error(`Instagram API Error (Publish): ${publishData.error.message}`)
        }

        return NextResponse.json({
            success: true,
            media_id: publishData.id,
            permalink: `https://www.instagram.com/p/${publishData.id}/` // Construct theoretical link or just ID
        })

    } catch (error: any) {
        console.error('Publish API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
