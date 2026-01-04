import { supabase } from '@/lib/supabase'

export async function uploadImage(file: Blob, fileName: string): Promise<string | null> {
    try {
        const { error: uploadError } = await supabase.storage
            .from('post_images')
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type || 'image/jpeg'
            })

        if (uploadError) {
            throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
            .from('post_images')
            .getPublicUrl(fileName)

        return publicUrl
    } catch (error) {
        console.error('Error uploading image:', error)
        return null
    }
}

export async function downloadImageAsBlob(url: string): Promise<Blob | null> {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch image')
        return await response.blob()
    } catch (error) {
        console.error('Error downloading image:', error)
        return null
    }
}
