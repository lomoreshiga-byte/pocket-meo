import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Pocket MEO - シンプルなMEO管理ツール',
    description: 'スマホで3秒で返信、5秒で投稿。店舗オーナーのためのシンプルなGBP・Instagram連携ツール',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Pocket MEO',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#3B82F6',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ja" className="scroll-smooth">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    )
}
