import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This would typically be triggered by Vercel Cron or an external scheduler
export async function GET(request: Request) {
    // In a real scenario, you'd want to verify a secret token to prevent unauthorized access
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { return new Response('Unauthorized', { status: 401 }); }

    console.log('Cron Job: Checking for new reviews...')

    // 1. Fetch users with LINE integration
    // This requires the service role key to bypass RLS and access all users' integrations
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || '' // You need to add this to env vars
    )

    // Mocking the database fetch for now since the table might be empty/non-existent
    // const { data: integrations } = await supabaseAdmin
    //     .from('integrations')
    //     .select('*')
    //     .eq('provider', 'line')

    const mockIntegrations = [
        { user_id: 'mock-user-1', provider_account_id: 'mock-line-uid', access_token: 'mock-token' }
    ]

    const results = []

    for (const integration of mockIntegrations) {
        try {
            // 2. Fetch new reviews for this user (Mock logic)
            // Real logic: Call GBP API, check last notified timestamp, filter new reviews
            const newReviews = [
                {
                    reviewer: '佐藤 次郎',
                    starRating: 'THREE',
                    comment: '味は普通でしたが、接客が良かったです。',
                    createTime: new Date().toISOString()
                }
            ]

            if (newReviews.length > 0) {
                // 3. Send LINE Notification
                await sendLineNotification(integration.provider_account_id, newReviews[0])
                results.push({ user: integration.user_id, status: 'Notified' })
            }
        } catch (error) {
            console.error(`Error processing user ${integration.user_id}:`, error)
        }
    }

    return NextResponse.json({ success: true, results })
}

async function sendLineNotification(to: string, review: any) {
    // LINE Messaging API implementation
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

    if (!channelAccessToken) {
        console.log(`[Mock] Sending LINE message to ${to}: New review by ${review.reviewer}`)
        return
    }

    const message = {
        to: to,
        messages: [
            {
                type: 'text',
                text: `新着クチコミのお知らせ\n\n評価: ${review.starRating}\n投稿者: ${review.reviewer}\n\n"${review.comment}"`
            }
        ]
    }

    await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${channelAccessToken}`
        },
        body: JSON.stringify(message)
    })
}
