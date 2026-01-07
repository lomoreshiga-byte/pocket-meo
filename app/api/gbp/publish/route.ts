import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { fetchGBPAccounts, fetchGBPLocations, createGBPPost } from '@/lib/google-api'

export async function POST(request: Request) {
    try {
        // 1. Authenticate Request
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

        if (!content) {
            return NextResponse.json({ error: 'Content (Summary) is required for Google posts' }, { status: 400 })
        }

        // 3. Get Integration Token
        const { data: integration, error: dbError } = await supabase
            .from('integrations')
            .select('access_token')
            .eq('provider', 'google')
            .single()

        if (dbError || !integration || !integration.access_token) {
            return NextResponse.json({ error: 'Google Business Profile not linked' }, { status: 400 })
        }

        const accessToken = integration.access_token

        // 4. Resolve Account and Location
        // We dynamically fetch these to ensure we post to the correct place
        const accounts = await fetchGBPAccounts(accessToken)
        const accountId = accounts.accounts?.[0]?.name // e.g. "accounts/12345"

        if (!accountId) {
            return NextResponse.json({ error: 'No Google Business Profile account found.' }, { status: 404 })
        }

        const locations = await fetchGBPLocations(accessToken, accountId)
        const locationId = locations.locations?.[0]?.name // e.g. "locations/67890"

        if (!locationId) {
            return NextResponse.json({ error: 'No location found for this Google Business Profile.' }, { status: 404 })
        }

        // 5. Create Post
        const result = await createGBPPost(accessToken, locationId, content, imageUrl)

        return NextResponse.json({
            success: true,
            post_id: result.searchUrl || 'CHECK_GBP_DASHBOARD',
        })

    } catch (error: any) {
        console.error('GBP Publish API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
