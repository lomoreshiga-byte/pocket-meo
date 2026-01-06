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

                // Upsert into integrations table
                const { error: dbError } = await supabase
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

                if (dbError) {
                    console.error('Failed to save integration token:', dbError)
                }
            } catch (err) {
                console.error('Error saving integration token:', err)
            }
        }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(requestUrl.origin + '/dashboard')
}
