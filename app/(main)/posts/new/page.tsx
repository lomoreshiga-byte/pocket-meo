'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { X, Image as ImageIcon, Send, Calendar, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { GoogleBusinessProfileLogo, InstagramLogo } from '@/components/icons'

export default function NewPostPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [content, setContent] = useState('')
    const [platform, setPlatform] = useState<'gbp' | 'instagram' | 'both'>('both')
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    // State for scheduling
    const [isScheduling, setIsScheduling] = useState(false)
    const [scheduledDate, setScheduledDate] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null) // New state for the actual file

    // Set default scheduled date to tomorrow same time if empty
    useEffect(() => {
        if (isScheduling && !scheduledDate) {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            // Format to YYYY-MM-DDTHH:mm for datetime-local input
            const localIso = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
            setScheduledDate(localIso)
        }
    }, [isScheduling, scheduledDate])

    const handleImageUpload = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            alert('画像サイズは5MB以下にしてください')
            return
        }

        setImageFile(file) // Store the file itself
        setImageUrl(URL.createObjectURL(file)) // Create a local URL for preview
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const savePost = async (status: 'published' | 'scheduled') => {
        if (!content.trim() && !imageFile) { // Changed to imageFile
            alert('本文または画像を入力してください')
            return
        }

        if (status === 'scheduled' && !scheduledDate) {
            alert('予約日時を設定してください')
            return
        }

        setIsSubmitting(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) { // Changed from session?.user to session
                alert('ログインしてください')
                return
            }

            // 画像アップロード
            let finalImageUrl = imageUrl // Use existing imageUrl if no new file is selected
            if (imageFile) { // If a new file is selected, upload it
                setIsUploading(true)
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}` // Changed fileName generation
                const filePath = `${session.user.id}/${fileName}` // Changed filePath generation

                const { error: uploadError } = await supabase.storage
                    .from('posts')
                    .upload(filePath, imageFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('posts')
                    .getPublicUrl(filePath)

                finalImageUrl = publicUrl
                setIsUploading(false)
            }

            // --- INSTAGRAM / GBP PUBLISHING LOGIC ---
            // Only execute immediate publishing if status is 'published'
            let instagramMediaId = null

            if (status === 'published') {
                if (platform === 'instagram' || platform === 'both') {
                    if (!finalImageUrl) { // Use finalImageUrl
                        alert('Instagramには画像が必須です')
                        return
                    }

                    const res = await fetch('/api/instagram/publish', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                            content,
                            imageUrl: finalImageUrl // Use finalImageUrl
                        })
                    })

                    const data = await res.json()

                    if (!res.ok) {
                        throw new Error(data.error || 'Instagramへの投稿に失敗しました')
                    }

                    instagramMediaId = data.media_id
                }

                if (platform === 'gbp' || platform === 'both') {
                    const res = await fetch('/api/gbp/publish', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                            content,
                            imageUrl: finalImageUrl // Use finalImageUrl
                        })
                    })

                    const data = await res.json()

                    if (!res.ok) {
                        throw new Error(data.error || 'Googleビジネスプロフィールへの投稿に失敗しました')
                    }
                }
            }

            // Save to DB
            // Calculate proper ISO string for scheduled_at
            let finalScheduledAt = null
            if (status === 'scheduled' && scheduledDate) {
                finalScheduledAt = new Date(scheduledDate).toISOString()
            }

            const { error } = await supabase
                .from('posts')
                .insert({
                    user_id: session.user.id,
                    content: content,
                    image_url: finalImageUrl, // Use finalImageUrl
                    platform: platform,
                    status: status,
                    scheduled_at: finalScheduledAt,
                    published_at: status === 'published' ? new Date().toISOString() : null,
                    external_id: instagramMediaId, // Optional
                })

            if (error) {
                console.error('Error saving post:', error)
                alert(`DB保存エラー: ${error.message}`)
                return
            }

            alert(status === 'published' ? '投稿が完了しました！' : '予約が完了しました！')

            // 成功したら一覧に戻る
            router.push('/posts')
            router.refresh()
        } catch (error: any) {
            console.error('Error submitting post:', error)
            alert(error.message || 'エラーが発生しました')
        } finally {
            setIsSubmitting(false)
            setIsUploading(false) // Ensure uploading state is reset
        }
    }

    const handlePublish = () => {
        if (isScheduling) {
            savePost('scheduled')
        } else {
            savePost('published')
        }
    }

    // UI Helpers
    const toggleScheduling = () => {
        setIsScheduling(!isScheduling)
        if (!isScheduling) {
            // Turning ON: Date set by useEffect
        } else {
            // Turning OFF
            setScheduledDate('')
        }
    }

    const maxLength = 1500
    const remaining = maxLength - content.length

    return (
        <div className="min-h-screen bg-background">
            {/* ヘッダー */}
            <div className="bg-primary text-primary-foreground pt-safe sticky top-0 z-10 md:static md:max-w-xl md:mx-auto md:rounded-t-xl md:mt-8">
                <div className="p-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="text-primary-foreground hover:bg-primary-foreground/10"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                    <h1 className="text-lg font-semibold">新規投稿</h1>
                    <div className="w-10" /> {/* スペーサー */}
                </div>
            </div>

            <div className="p-4 space-y-4 md:max-w-xl md:mx-auto">
                {/* プラットフォーム選択 */}
                <Card className="p-4">
                    <p className="text-sm font-medium mb-3">投稿先</p>
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant={platform === 'gbp' ? 'default' : 'outline'}
                            onClick={() => setPlatform('gbp')}
                            className="h-auto py-3 flex-col gap-2"
                        >
                            <GoogleBusinessProfileLogo className="w-8 h-8" />
                            <span className="text-xs font-medium">GBP</span>
                        </Button>
                        <Button
                            variant={platform === 'instagram' ? 'default' : 'outline'}
                            onClick={() => setPlatform('instagram')}
                            className="h-auto py-3 flex-col gap-2"
                        >
                            <InstagramLogo className="w-8 h-8" />
                            <span className="text-xs font-medium">Instagram</span>
                        </Button>
                        <Button
                            variant={platform === 'both' ? 'default' : 'outline'}
                            onClick={() => setPlatform('both')}
                            className="h-auto py-3 flex-col gap-2"
                        >
                            <div className="flex -space-x-3 items-center justify-center">
                                <GoogleBusinessProfileLogo className="w-6 h-6 border-2 border-background rounded-full bg-white relative z-10" />
                                <InstagramLogo className="w-6 h-6 border-2 border-background rounded-full bg-white text-pink-500" />
                            </div>
                            <span className="text-xs font-medium">両方</span>
                        </Button>
                    </div>
                </Card>

                {/* 画像アップロード */}
                <Card className="p-4">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    {imageUrl ? (
                        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setImageUrl(null)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <button
                            onClick={handleImageUpload}
                            disabled={isUploading}
                            className="w-full aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">アップロード中...</p>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        タップして画像を追加
                                    </p>
                                </>
                            )}
                        </button>
                    )}
                </Card>

                {/* テキスト入力 */}
                <Card className="p-4">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="投稿内容を入力..."
                        className="min-h-[200px] border-0 p-0 focus-visible:ring-0 resize-none"
                        maxLength={maxLength}
                    />
                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                            {remaining}文字残り
                        </p>
                        {platform === 'instagram' && (
                            <p className="text-xs text-muted-foreground">
                                #ハッシュタグも使えます
                            </p>
                        )}
                    </div>
                </Card>

                {/* アクションボタン */}
                <div className="flex gap-4">
                    {/* Schedule Toggle */}
                    <div className="flex-1">
                        <Button
                            variant={isScheduling ? "default" : "outline"}
                            className={`w-full justify-start ${isScheduling ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                            onClick={toggleScheduling}
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            {isScheduling ? '予約投稿モード' : '日時を指定して予約'}
                        </Button>
                    </div>
                </div>

                {isScheduling && (
                    <div className="bg-muted/50 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm font-medium mb-2 block">予約日時</label>
                        <input
                            type="datetime-local"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            指定した日時（10分単位）に自動的に投稿されます。
                        </p>
                    </div>
                )}

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:static md:p-0 md:bg-transparent md:border-t-0">
                    <Button
                        className={`w-full h-12 text-lg font-bold ${isScheduling ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-primary/90'}`}
                        onClick={handlePublish}
                        disabled={!content.trim() || isSubmitting || isUploading}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {isScheduling ? '予約保存中...' : '投稿中...'}
                            </>
                        ) : (
                            <>
                                <Calendar className="w-4 h-4 mr-2" />
                                日時を指定して予約
                            </Button>
                </div>
            </div>
        </div>
    )
}
