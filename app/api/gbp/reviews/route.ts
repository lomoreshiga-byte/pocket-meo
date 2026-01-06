import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch token from 'integrations' table
    const { data: integration } = await supabase
        .from('integrations')
        .select('access_token')
        .eq('user_id', session.user.id)
        .eq('provider', 'google')
        .single()

    const providerToken = integration?.access_token || session.provider_token // Fallback to session token for initial login if DB fetch fails (optional)

    if (!providerToken) {
        // Fallback to mock data for demo purposes if real integration isn't fully set up
        return NextResponse.json({
            reviews: [
                {
                    reviewId: 'r1',
                    reviewer: { displayName: '田中 太郎', profilePhotoUrl: 'https://ui-avatars.com/api/?name=T+T&background=random' },
                    starRating: 'FIVE',
                    comment: 'とても美味しかったです！また来ます。',
                    createTime: new Date().toISOString(),
                    replyComment: null
                },
                {
                    reviewId: 'r2',
                    reviewer: { displayName: '鈴木 花子', profilePhotoUrl: 'https://ui-avatars.com/api/?name=S+H&background=random' },
                    starRating: 'FOUR',
                    comment: '雰囲気は良いですが、少し待ちました。',
                    createTime: new Date(Date.now() - 86400000).toISOString(),
                    replyComment: 'ご来店ありがとうございます。お待たせして申し訳ございません。'
                }
            ]
        })
    }

    try {
        // API Call to Google My Business
        // Note: This requires the Account ID and Location ID which we would also need to fetch/store.
        const response = await fetch('https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews', {
            headers: {
                Authorization: `Bearer ${providerToken}`
            }
        })

        if (!response.ok) {
            throw new Error('Failed to fetch from Google')
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('GBP API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }
}
