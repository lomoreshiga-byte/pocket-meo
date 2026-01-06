'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PostsClient from '@/components/posts/PostsClient'
import { Post } from '@/types'
import { Loader2 } from 'lucide-react'

export default function PostsPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [googleToken, setGoogleToken] = useState<string | null>(null)
    const [instagramToken, setInstagramToken] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [debugCookies, setDebugCookies] = useState<string[]>([])
    const [debugIntegrations, setDebugIntegrations] = useState<string[]>([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.access_token) {
                // Not logged in or no session
                setLoading(false)
                return
            }

            setUserId(session.user.id)
            setDebugCookies(['Client-Side Fetch', 'Session Found'])

            // Call API with Bearer Token
            const res = await fetch('/api/instagram/posts', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Failed to fetch posts')
            }

            const data = await res.json()
            setPosts(data.posts || [])
            setGoogleToken(data.googleToken || null)
            setInstagramToken(data.instagramToken || null)
            if (data.debugIntegrations) {
                setDebugIntegrations(data.debugIntegrations)
            }

        } catch (err: any) {
            console.error('Fetch error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <PostsClient
            initialIgPosts={posts}
            googleToken={googleToken}
            instagramToken={instagramToken}
            userId={userId}
            error={error}
            debugCookies={debugCookies}
            debugIntegrations={debugIntegrations}
        />
    )
}
