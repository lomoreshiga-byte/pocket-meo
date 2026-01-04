import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase' // Note: This uses the client-side supabase. In real prod, use supabase-admin with service role key.
import { fetchInstagramMediaDetails } from '@/lib/instagram-api'

// Webhook検証用トークン（Instagramアプリ設定と一致させる必要がある）
const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'pocket-meo-verify-token'

// GET: Webhookの検証 (Verification Request)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED')
            return new NextResponse(challenge, { status: 200 })
        } else {
            return new NextResponse('Forbidden', { status: 403 })
        }
    }
    return new NextResponse('Bad Request', { status: 400 })
}

// POST: イベント通知 (Event Notification)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('Webhook Received:', JSON.stringify(body))

        // InstagramのWebhookペイロード構造（例）
        // {
        //   "object": "instagram",
        //   "entry": [
        //     {
        //       "id": "instagram-account-id",
        //       "time": 12345678,
        //       "changes": [
        //         {
        //           "field": "media_product_type", // or "media"
        //           "value": { "id": "media-id" }
        //         }
        //       ]
        //     }
        //   ]
        // }

        if (body.object === 'instagram') {
            for (const entry of body.entry) {
                const instagramAccountId = entry.id

                // SupabaseからこのInstagram IDを持つユーザーを探す
                // 注意: user_idを特定するために、usersテーブルなどを検索する必要がある
                // 今回は簡単のため、該当するユーザーがいると仮定して処理を進める

                // 変更内容を処理
                for (const change of entry.changes) {
                    // mediaの変更、またはmedia_product_type（Feed投稿など）
                    if (change.field === 'media' || change.field === 'media_product_type') {
                        const mediaId = change.value.id

                        // メディア詳細を取得 (Mock)
                        const mediaDetails = await fetchInstagramMediaDetails(mediaId, 'dummy_token')

                        if (mediaDetails) {
                            // ユーザーIDの特定（本来はDB検索が必要）
                            // 暫定対応: 直近ログインしたユーザー、または固定ユーザーIDを使う等の工夫が必要だが、
                            // ここではWebhookがバックグラウンドで走るため、ユーザーコンテキストがない。
                            // Supabase Admin Clientを使って、instagram_account_idからユーザーを検索するのが正解。

                            // Mock: とりあえずDBに保存しようとしてみる（RLSで弾かれる可能性大だが、Server Actionならいける）
                            // 今回はログ出力と、「自動連携成功」とみなす処理に留める（完動させるにはService Role Keyが必要）

                            console.log('Processing new media:', mediaDetails.caption)

                            // TODO: Implement actual DB insert using Service Role Key
                            // const { error } = await supabaseAdmin.from('posts').insert(...)
                        }
                    }
                }
            }
            return new NextResponse('EVENT_RECEIVED', { status: 200 })
        }

        return new NextResponse('Not Found', { status: 404 })

    } catch (error) {
        console.error('Webhook Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
