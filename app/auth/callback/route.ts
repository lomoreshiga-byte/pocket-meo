import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

        if (session?.user && session.provider_token) {
            try {
                // Determine provider from user app_metadata or identity
                const identity = session.user.identities?.find((id: { provider: string }) => id.provider === session.user.app_metadata.provider)
                const provider = identity?.provider || 'google' // default fallback

                // Upsert into integrations table
                // Note: This requires the table to exist (run migration!)
                const { error: dbError } = await supabase
                    .from('integrations')
                    .upsert({
                        user_id: session.user.id,
                        provider: provider === 'facebook' ? 'instagram' : provider, // Map facebook to instagram for this app context if needed
                        provider_account_id: identity?.id,
                        access_token: session.provider_token,
                        refresh_token: session.provider_refresh_token,
                        expires_at: session.expires_at, // This is usually session expiry, not token expiry, but acceptable proxy
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
