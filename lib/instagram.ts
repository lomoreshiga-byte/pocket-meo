/**
 * Instagram Publishing Logic
 * Refactored for reuse in API and Cron Jobs
 */

export async function publishToInstagram(
    accessToken: string,
    dbAccountId: string, // provider_account_id from DB
    imageUrl: string,
    content: string
) {
    // 1. Resolve Account ID
    // provider_account_id in DB *might* be the Facebook User ID (implicit auth).
    // We must ensure we have the Instagram Business Account ID.
    let accountId = dbAccountId

    // Fetch user's pages to find the connected IG account
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts`
    const pagesParams = new URLSearchParams({
        fields: 'instagram_business_account',
        access_token: accessToken
    })

    const pagesRes = await fetch(`${pagesUrl}?${pagesParams.toString()}`)
    const pagesData = await pagesRes.json()

    if (!pagesData.error && pagesData.data) {
        const pageWithIg = pagesData.data.find((p: any) => p.instagram_business_account?.id)
        if (pageWithIg?.instagram_business_account?.id) {
            accountId = pageWithIg.instagram_business_account.id
        }
    }

    // 2. Create Media Container
    const containerUrl = `https://graph.facebook.com/v19.0/${accountId}/media`
    const containerParams = new URLSearchParams({
        image_url: imageUrl,
        caption: content || '',
        access_token: accessToken
    })

    const containerRes = await fetch(`${containerUrl}?${containerParams.toString()}`, { method: 'POST' })
    const containerData = await containerRes.json()

    if (containerData.error) {
        console.error('IG Container Error:', containerData.error)
        throw new Error(`Instagram API Error (Create): ${containerData.error.message}`)
    }

    const creationId = containerData.id

    // 3. Wait for Media to be Ready (Polling)
    let attempts = 0
    const maxAttempts = 10
    let isReady = false

    while (attempts < maxAttempts && !isReady) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        attempts++

        const statusUrl = `https://graph.facebook.com/v19.0/${creationId}`
        const statusParams = new URLSearchParams({
            fields: 'status_code',
            access_token: accessToken
        })
        const statusRes = await fetch(`${statusUrl}?${statusParams.toString()}`)
        const statusData = await statusRes.json()

        if (statusData.status_code === 'FINISHED') {
            isReady = true
        } else if (statusData.status_code === 'ERROR') {
            throw new Error('Instagram failed to process the image.')
        }
        // If IN_PROGRESS, loop again
    }

    if (!isReady) {
        throw new Error('Instagram processing timed out. Please try again.')
    }

    // 4. Publish Media
    const publishUrl = `https://graph.facebook.com/v19.0/${accountId}/media_publish`
    const publishParams = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken
    })

    const publishRes = await fetch(`${publishUrl}?${publishParams.toString()}`, { method: 'POST' })
    const publishData = await publishRes.json()

    if (publishData.error) {
        console.error('IG Publish Error:', publishData.error)
        throw new Error(`Instagram API Error (Publish): ${publishData.error.message}`)
    }

    return { id: publishData.id }
}
