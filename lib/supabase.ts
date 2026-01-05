import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 認証ヘルパー関数
export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
            scopes: 'https://www.googleapis.com/auth/business.manage',
        },
    })
    return { data, error }
}

export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (!error && typeof window !== 'undefined') {
        window.location.href = '/login'
    }
    return { error }
}

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
}

export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
}
