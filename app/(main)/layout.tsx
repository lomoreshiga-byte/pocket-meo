import { BottomNav } from '@/components/BottomNav'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            {/* メインコンテンツエリア */}
            <main className="pb-20">
                {children}
            </main>

            {/* ボトムナビゲーション */}
            <BottomNav />
        </div>
    )
}
