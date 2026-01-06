import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    // Default redirect
    let redirectTo = '/dashboard'

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

            if (error) throw error

            if (session) {
                // Check if this is an Instagram integration flow
                // We check the requested provider request param or the user metadata
                // Note: provider param might be lost in some redirect chains, but let's check.
                const urlParams = new URLSearchParams(requestUrl.search)
                const isInstagram = urlParams.get('provider') === 'instagram'
                    || requestUrl.searchParams.get('provider') === 'instagram'

                // If we have a provider token, this is likely a fresh link/login
                if (session.provider_token) {
                    // Decide where to go
                    if (isInstagram) {
                        // Pass the token to the client settings page to save it
                        const params = new URLSearchParams()
                        params.set('provider_token', session.provider_token)
                        if (session.provider_refresh_token) {
                            params.set('refresh_token', session.provider_refresh_token)
                        }
                        params.set('status', 'captured_by_server')

                        redirectTo = `/settings/integrations?${params.toString()}`
                    }
                }
            }
        } catch (error) {
            console.error('Auth Callback Error:', error)
            // Still redirect to dashboard or settings to handle error
            redirectTo = '/dashboard?error=auth_callback_failed'
        }
    }

    const response = NextResponse.redirect(requestUrl.origin + redirectTo)

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
