import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/dashboard'
    const providerParam = requestUrl.searchParams.get('provider')

    // We will build the redirect URL based on 'next'
    const targetUrl = new URL(next, requestUrl.origin)

    if (code) {
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

        try {
            const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                targetUrl.searchParams.set('error', error.message)
                targetUrl.searchParams.set('debug_step', 'exchange_failed')
            }

            if (session) {
                // Debug info
                targetUrl.searchParams.set('debug_session', 'yes')
                targetUrl.searchParams.set('debug_has_token', session.provider_token ? 'yes' : 'no')

                // If we have a provider token, pass it to the client
                if (session.provider_token) {
                    // Check if this is likely Instagram
                    if (providerParam === 'instagram' || session.user?.app_metadata?.provider === 'facebook') {
                        targetUrl.searchParams.set('provider_token', session.provider_token)
                        if (session.provider_refresh_token) {
                            targetUrl.searchParams.set('refresh_token', session.provider_refresh_token)
                        }
                        targetUrl.searchParams.set('status_message', 'Token relayed from server')
                    }
                } else {
                    targetUrl.searchParams.set('status_message', 'No provider token in session')
                }
            } else {
                targetUrl.searchParams.set('debug_session', 'no')
            }

        } catch (error: any) {
            console.error('Auth Callback Error:', error)
            targetUrl.searchParams.set('error', 'server_error')
            targetUrl.searchParams.set('debug_step', 'catch_block')
            targetUrl.searchParams.set('debug_msg', error.message)
        }
    } else {
        targetUrl.searchParams.set('error', 'no_code')
    }

    const response = NextResponse.redirect(targetUrl.toString())

    // Manual Cookie Copying to Response to ensure persistence
    const cookieStore = cookies()
    cookieStore.getAll().forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value, {
            domain: cookie.domain,
            path: cookie.path,
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite as any,
            maxAge: cookie.maxAge,
            expires: cookie.expires ? new Date(cookie.expires) : undefined
        })
    })

    return response
}
