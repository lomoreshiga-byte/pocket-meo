import { Sidebar } from '@/components/Sidebar'
import { BottomNav } from '@/components/BottomNav'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            {/* サイドバー（PCのみ） */}
            <Sidebar />

            {/* メインコンテンツエリア */}
            <main className="pb-20 md:pb-0 md:pl-64 min-h-screen bg-slate-50/50">
                <div className="max-w-7xl mx-auto w-full md:p-8">
                    {children}
                </div>
            </main>

            {/* ボトムナビゲーション（モバイルのみ） */}
            <BottomNav />
        </div>
    )
}
