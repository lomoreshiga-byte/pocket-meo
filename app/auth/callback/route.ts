import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

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

        const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

        if (session?.user && session.provider_token) {
            try {
                // Determine provider: priority to URL param (for linking), then metadata (for login)
                const urlProvider = requestUrl.searchParams.get('provider')
                const appMetadataProvider = session.user.app_metadata.provider
                const provider = urlProvider || appMetadataProvider || 'google'

                // Find matching identity (Note: 'instagram' provider in our app maps to 'facebook' identity in Supabase)
                const searchProvider = provider === 'instagram' ? 'facebook' : provider
                const identity = session.user.identities?.find((id: { provider: string }) => id.provider === searchProvider)

                let upsertClient = supabase

                // Try to use Service Role Key if available to bypass RLS
                if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                    const { createClient } = require('@supabase/supabase-js')
                    upsertClient = createClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY,
                        {
                            auth: {
                                autoRefreshToken: false,
                                persistSession: false
                            }
                        }
                    )
                }

                if (!identity) {
                    console.warn('Facebook identity not found in session')
                    // Try to proceed anyway, or error? Proceeding, but logging.
                }

                // Upsert into integrations table
                const { data: savedData, error: dbError } = await upsertClient
                    .from('integrations')
                    .upsert({
                        user_id: session.user.id,
                        provider: provider === 'facebook' ? 'instagram' : provider,
                        provider_account_id: identity?.id,
                        access_token: session.provider_token,
                        refresh_token: session.provider_refresh_token,
                        expires_at: session.expires_at,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id, provider' })
                    .select()
                    .single()

                if (dbError) {
                    console.error('Failed to save integration token:', dbError)
                    return NextResponse.redirect(`${requestUrl.origin}/settings/integrations?error=${encodeURIComponent(dbError.message)}&details=${encodeURIComponent(JSON.stringify(dbError))}`)
                }

                if (!savedData) {
                    console.error('Saved but no data returned')
                    return NextResponse.redirect(`${requestUrl.origin}/settings/integrations?error=SaveVerificationFailed&details=NoDataReturned`)
                }
            } catch (err: any) {
                console.error('Error saving integration token:', err)
                return NextResponse.redirect(`${requestUrl.origin}/settings/integrations?error=UnexpectedError&details=${encodeURIComponent(err.message)}`)
            }
        } else {
            // Debug missing token/session
            const errorType = !session ? 'NoSession' : !session.provider_token ? 'NoProviderToken' : 'Unknown'
            console.error(`Callback error: ${errorType}`)
            return NextResponse.redirect(`${requestUrl.origin}/settings/integrations?error=${errorType}&details=SessionOrTokenMissing`)
        }
    }

    // URL to redirect to after sign in process completes
    const redirectTo = requestUrl.searchParams.get('provider') === 'instagram'
        ? '/settings/integrations?status=success'
        : '/dashboard'

    return NextResponse.redirect(requestUrl.origin + redirectTo)
}
