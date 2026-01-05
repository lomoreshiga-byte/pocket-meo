import type { Metadata, Viewport } from 'next'
import { M_PLUS_Rounded_1c } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const mPlusRounded1c = M_PLUS_Rounded_1c({
    weight: ['100', '300', '400', '500', '700', '800', '900'],
    subsets: ['latin'],
    display: 'swap',
    adjustFontFallback: false,
})

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
            <body className={mPlusRounded1c.className}>
                {children}
                <Toaster position="top-right" />
            </body>
        </html>
    )
}
