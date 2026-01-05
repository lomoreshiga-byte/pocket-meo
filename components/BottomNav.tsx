'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Star, PenSquare, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    {
        label: 'ホーム',
        href: '/dashboard',
        icon: Home,
    },
    {
        label: 'クチコミ',
        href: '/reviews',
        icon: Star,
    },
    {
        label: '投稿',
        href: '/posts',
        icon: PenSquare,
    },
    {
        label: 'メニュー',
        href: '/menu',
        icon: Menu,
    },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-safe md:hidden">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn(
                                "w-6 h-6 transition-transform",
                                isActive && "scale-110"
                            )} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
