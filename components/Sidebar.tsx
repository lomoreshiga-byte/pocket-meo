'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    Home,
    Star,
    LayoutDashboard,
    PenSquare,
    Settings,
    Store,
    LogOut,
    User,
    BarChart3,
    AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOut, getCurrentUser } from '@/lib/supabase'

const navItems = [
    {
        label: 'ダッシュボード',
        href: '/dashboard',
        icon: Home,
    },
    {
        label: 'パフォーマンス分析',
        href: '/analytics',
        icon: BarChart3,
    },
    {
        label: 'クチコミ管理',
        href: '/reviews',
        icon: Star,
    },
    {
        label: '投稿管理',
        href: '/posts',
        icon: PenSquare,
    },
    {
        label: 'デバッグ',
        href: '/debug',
        icon: AlertCircle, // Temporary
    },
    {
        label: '設定',
        href: '/settings',
        icon: Settings,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [userEmail, setUserEmail] = useState<string>('')
    const [userAvatar, setUserAvatar] = useState<string>('')

    useEffect(() => {
        const fetchUser = async () => {
            const { user } = await getCurrentUser()
            if (user) {
                setUserEmail(user.email || '')
                setUserAvatar(user.user_metadata?.avatar_url || '')
            }
        }
        fetchUser()
    }, [])

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-slate-900 text-white z-50">
            {/* ロゴエリア */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <span className="text-xl font-bold tracking-tight">Pocket MEO</span>
            </div>

            {/* ナビゲーション */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* ユーザー情報エリア */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <Avatar className="w-8 h-8 border border-slate-600">
                        <AvatarImage src={userAvatar} />
                        <AvatarFallback className="bg-slate-700 text-slate-200">
                            <User className="w-4 h-4" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">ユーザー</p>
                        <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-2 pl-2"
                    onClick={handleSignOut}
                >
                    <LogOut className="w-4 h-4" />
                    ログアウト
                </Button>
            </div>
        </aside>
    )
}
