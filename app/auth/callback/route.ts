import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    let redirectTo = requestUrl.searchParams.get('provider') === 'instagram'
        ? '/settings/integrations?status=success'
        : '/dashboard'

    if (code) {
        const cookieStore = cookies()

        // We need to capture the response to set cookies on it
        // We'll create the response object at the very end using the final redirectTo

        // Create a temporary client just to exchange the code
        // We will manually handle cookies later
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

        const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

        // Debug params
        const hasSession = !!session
        const hasUser = !!session?.user
        const hasToken = !!session?.provider_token

        redirectTo += `&debug_session=${hasSession ? 'YES' : 'NO'}`
        redirectTo += `&debug_user=${hasUser ? 'YES' : 'NO'}`
        redirectTo += `&debug_token=${hasToken ? 'YES' : 'NO'}`

        if (session?.user && session.provider_token) {
            try {
                const urlProvider = requestUrl.searchParams.get('provider')
                const appMetadataProvider = session.user.app_metadata.provider
                const provider = urlProvider || appMetadataProvider || 'google'
                redirectTo += `&debug_provider=${provider}`

                const searchProvider = provider === 'instagram' ? 'facebook' : provider
                const identity = session.user.identities?.find((id: { provider: string }) => id.provider === searchProvider)

                // Use authenticated client (Supabase) which has the user's rights via RLS
                // verification: The `supabase` client is already authenticated with the session from exchangeCodeForSession

                // Upsert into integrations table
                const { data: savedData, error: dbError } = await supabase
                    .from('integrations')
                    .upsert({
                        user_id: session.user.id,
                        provider: provider === 'facebook' ? 'instagram' : provider,
                        provider_account_id: identity?.id,
                        access_token: session.provider_token,
                        refresh_token: session.provider_refresh_token,
                        expires_at: session.expires_at,
                        updated_at: new Date().toISOString(),
                        meta_data: {
                            scopes: session.provider_token ? 'granted' : 'missing' // Just debugging metadata
                        }
                    }, { onConflict: 'user_id, provider' })
                    .select()
                    .single()

                if (dbError) {
                    console.error('Failed to save integration token:', dbError)
                    redirectTo = `/settings/integrations?error=${encodeURIComponent(dbError.message)}&details=${encodeURIComponent(JSON.stringify(dbError))}`
                } else if (!savedData) {
                    console.error('Saved but no data returned')
                    redirectTo = `/settings/integrations?error=SaveVerificationFailed&details=NoDataReturned`
                } else {
                    redirectTo += `&debug_saved=YES`
                }
            } catch (err: any) {
                console.error('Error saving integration token:', err)
                redirectTo = `/settings/integrations?error=UnexpectedError&details=${encodeURIComponent(err.message)}`
            }
        } else {
            redirectTo += `&debug_saved=SKIPPED`
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
