import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import PostsClient from '@/components/posts/PostsClient'
import { Post } from '@/types'
import { fetchInstagramMedia, InstagramMedia } from '@/lib/instagram-api'

export const dynamic = 'force-dynamic'

// Helper function to convert Media to Post
const convertIgMediaToPost = (media: InstagramMedia): Post => {
    return {
        id: media.id,
        userId: 'instagram-user',
        content: media.caption || '',
        imageUrl: media.media_url,
        platform: 'instagram',
        status: 'published',
        publishedAt: new Date(media.timestamp),
        createdAt: new Date(media.timestamp)
    }
}

export default async function PostsPage() {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()

    let initialIgPosts: Post[] = []
    let googleToken: string | null = null
    let instagramToken: string | null = null
    let error: string | null = null

    if (session?.user) {
        try {
            // Fetch Integrations
            const { data: integrations, error: dbError } = await supabase
                .from('integrations')
                .select('provider, access_token')
                .eq('user_id', session.user.id)
                .in('provider', ['google', 'instagram'])

            if (dbError) {
                console.error('Integrations fetch error:', dbError)
                error = '連携情報の取得に失敗しました'
            } else if (integrations) {
                const igIntegration = integrations.find(i => i.provider === 'instagram')
                const googleIntegration = integrations.find(i => i.provider === 'google')

                instagramToken = igIntegration?.access_token || null
                googleToken = googleIntegration?.access_token || null

                if (instagramToken) {
                    try {
                        const media = await fetchInstagramMedia(instagramToken)
                        initialIgPosts = media.map(m => convertIgMediaToPost(m))
                    } catch (err: any) {
                        console.error('IG Media fetch error:', err)
                        error = 'Instagramの投稿取得に失敗しました: ' + (err.message || String(err))
                    }
                }
            }
        } catch (err: any) {
            console.error('Server setup error:', err)
            error = 'サーバー側での処理中にエラーが発生しました'
        }
    }

    return (
        <PostsClient
            initialIgPosts={initialIgPosts}
            googleToken={googleToken}
            instagramToken={instagramToken}
            userId={session?.user?.id || null}
            error={error}
        />
    )
}
