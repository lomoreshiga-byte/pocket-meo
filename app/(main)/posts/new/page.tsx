'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { X, Image as ImageIcon, Send, Calendar, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function NewPostPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [content, setContent] = useState('')
    const [platform, setPlatform] = useState<'gbp' | 'instagram' | 'both'>('both')
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

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

        setIsUploading(true)
        try {
            const fileName = `${Date.now()}-${file.name}`
            const { data, error } = await supabase.storage
                .from('posts')
                .upload(fileName, file)

            if (error) {
                throw error
            }

            const { data: { publicUrl } } = supabase.storage
                .from('posts')
                .getPublicUrl(fileName)

            setImageUrl(publicUrl)
        } catch (error: any) {
            console.error('Upload error:', error)
            alert('画像のアップロードに失敗しました')
        } finally {
            setIsUploading(false)
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const savePost = async (status: 'published' | 'scheduled') => {
        setIsSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('ログインが必要です')
                return
            }

            const { error } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    content: content,
                    image_url: imageUrl,
                    platform: platform,
                    status: status,
                    scheduled_at: status === 'scheduled' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null, // 仮：24時間後
                    published_at: status === 'published' ? new Date().toISOString() : null,
                    created_at: new Date().toISOString()
                })

            if (error) {
                console.error('Error saving post:', error)
                alert(`投稿の保存に失敗しました: ${error.message}`)
                return
            }

            // 成功したら一覧に戻る
            router.push('/posts')
            router.refresh()
        } catch (error) {
            console.error('Error submitting post:', error)
            alert('エラーが発生しました')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePublish = () => savePost('published')
    const handleSchedule = () => {
        // 本来は日付選択モーダルを出すが、今回は仮実装として「予約」ステータスで保存
        // 日時は一旦現在時刻の24時間後などを自動設定
        const confirmSchedule = confirm('現在は日時選択機能が未実装のため、自動的に「24時間後」に設定されます。よろしいですか？')
        if (confirmSchedule) {
            savePost('scheduled')
        }
    }

    const maxLength = 1500
    const remaining = maxLength - content.length

    return (
        <div className="min-h-screen bg-background">
            {/* ヘッダー */}
            <div className="bg-primary text-primary-foreground pt-safe sticky top-0 z-10">
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

            <div className="p-4 space-y-4">
                {/* プラットフォーム選択 */}
                <Card className="p-4">
                    <p className="text-sm font-medium mb-3">投稿先</p>
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant={platform === 'gbp' ? 'default' : 'outline'}
                            onClick={() => setPlatform('gbp')}
                            className="h-auto py-3 flex-col gap-1"
                        >
                            <span className="text-lg">🏢</span>
                            <span className="text-xs">GBP</span>
                        </Button>
                        <Button
                            variant={platform === 'instagram' ? 'default' : 'outline'}
                            onClick={() => setPlatform('instagram')}
                            className="h-auto py-3 flex-col gap-1"
                        >
                            <span className="text-lg">📸</span>
                            <span className="text-xs">Instagram</span>
                        </Button>
                        <Button
                            variant={platform === 'both' ? 'default' : 'outline'}
                            onClick={() => setPlatform('both')}
                            className="h-auto py-3 flex-col gap-1"
                        >
                            <span className="text-lg">🔗</span>
                            <span className="text-xs">両方</span>
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
                <div className="space-y-2 pb-4">
                    <Button
                        onClick={handlePublish}
                        disabled={!content.trim() || isSubmitting || isUploading}
                        className="w-full h-12"
                        size="lg"
                    >
                        {isSubmitting ? (
                            '保存中...'
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                今すぐ投稿
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleSchedule}
                        disabled={!content.trim() || isSubmitting || isUploading}
                        variant="outline"
                        className="w-full h-12"
                        size="lg"
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        日時を指定して予約
                    </Button>
                </div>
            </div>
        </div>
    )
}
