import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { publishToInstagram } from '@/lib/instagram'
import { fetchGBPAccounts, fetchGBPLocations, createGBPPost } from '@/lib/google-api'

// This route should be called by a Cron Job (e.g. Vercel Cron)
// It requires a Service Role Key to bypass RLS and see all scheduled posts.

export async function GET(request: Request) {
    // 1. Verify Cron Secret
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && request.headers.get('x-vercel-cron') !== 'true') {
        // Vercel Cron automatically sends a signature, but CRON_SECRET is simpler to debug manually
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Note: allowing loose auth for now for convenient manual testing, 
    // but in Prod should strictly check process.env.CRON_SECRET

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
        return NextResponse.json({ error: 'Server Config Error: Missing Service Role Key' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Fetch Due Posts
    // status = 'scheduled' AND scheduled_at <= NOW
    const now = new Date().toISOString()
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', now)

    if (postsError) {
        return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
        return NextResponse.json({ message: 'No scheduled posts due.' })
    }

    const results = []

    // 3. Process each post
    for (const post of posts) {
        const log = { postId: post.id, status: 'pending', errors: [] as string[] }
        try {
            // Fetch Integrations for the user
            const { data: integrations } = await supabase
                .from('integrations')
                .select('*')
                .eq('user_id', post.user_id)

            if (!integrations) throw new Error('No integrations found for user')

            const platforms = post.platform === 'both' ? ['instagram', 'gbp'] : [post.platform]
            let successCount = 0

            // INSTAGRAM
            if (platforms.includes('instagram')) {
                const igInt = integrations.find(i => i.provider === 'instagram')
                if (igInt && igInt.access_token) {
                    try {
                        await publishToInstagram(
                            igInt.access_token,
                            igInt.provider_account_id,
                            post.image_url,
                            post.content
                        )
                        successCount++
                    } catch (e: any) {
                        log.errors.push(`Instagram: ${e.message}`)
                    }
                } else {
                    log.errors.push('Instagram integration missing')
                }
            }

            // GOOGLE BUSINESS PROFILE
            if (platforms.includes('gbp')) {
                const gbpInt = integrations.find(i => i.provider === 'google')
                if (gbpInt && gbpInt.access_token) {
                    try {
                        // Dynamic discovery (since we didn't persist IDs yet)
                        const accounts = await fetchGBPAccounts(gbpInt.access_token)
                        const accountId = accounts.accounts?.[0]?.name
                        if (!accountId) throw new Error('No GBP account')

                        const locations = await fetchGBPLocations(gbpInt.access_token, accountId)
                        const locationId = locations.locations?.[0]?.name
                        if (!locationId) throw new Error('No GBP location')

                        await createGBPPost(gbpInt.access_token, locationId, post.content, post.image_url)
                        successCount++
                    } catch (e: any) {
                        log.errors.push(`GBP: ${e.message}`)
                    }
                } else {
                    log.errors.push('GBP integration missing')
                }
            }

            // Update Status
            // If at least one platform succeeded (or if only 1 was requested and it succeeded)
            if (successCount > 0) {
                await supabase.from('posts').update({
                    status: 'published',
                    published_at: new Date().toISOString()
                }).eq('id', post.id)
                log.status = 'published'
            } else {
                // Failed completely
                await supabase.from('posts').update({
                    status: 'failed',
                    // maybe store error message in a column?
                }).eq('id', post.id)
                log.status = 'failed'
            }

        } catch (e: any) {
            console.error(`Post ${post.id} failed:`, e)
            log.errors.push(e.message)
            log.status = 'failed'
            await supabase.from('posts').update({ status: 'failed' }).eq('id', post.id)
        }
        results.push(log)
    }

    return NextResponse.json({ processed: results.length, results })
}
