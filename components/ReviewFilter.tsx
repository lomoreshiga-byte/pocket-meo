'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Calendar as CalendarIcon, X } from 'lucide-react'
import { format, subWeeks, subMonths, subYears, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

export type FilterConditions = {
    replyStatus: ('unreplied' | 'replied')[]
    ratings: number[]
    dateRange: 'all' | '1week' | '1month' | '3months' | '6months' | '1year' | 'custom'
    customStartDate: string
    customEndDate: string
}

interface ReviewFilterProps {
    onFilterChange: (conditions: FilterConditions) => void
    initialConditions?: FilterConditions
}

export function ReviewFilter({ onFilterChange, initialConditions }: ReviewFilterProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [conditions, setConditions] = useState<FilterConditions>(initialConditions || {
        replyStatus: ['unreplied'],
        ratings: [5, 4, 3, 2, 1],
        dateRange: 'all',
        customStartDate: '',
        customEndDate: ''
    })

    // 内部変更用の一時State（「設定する」ボタンで確定するため）
    const [tempConditions, setTempConditions] = useState<FilterConditions>(conditions)

    useEffect(() => {
        setTempConditions(conditions)
    }, [conditions])

    const toggleReplyStatus = (status: 'unreplied' | 'replied') => {
        setTempConditions(prev => {
            const exists = prev.replyStatus.includes(status)
            if (exists) {
                return { ...prev, replyStatus: prev.replyStatus.filter(s => s !== status) }
            } else {
                return { ...prev, replyStatus: [...prev.replyStatus, status] }
            }
        })
    }

    const toggleRating = (rating: number) => {
        setTempConditions(prev => {
            const exists = prev.ratings.includes(rating)
            if (exists) {
                return { ...prev, ratings: prev.ratings.filter(r => r !== rating) }
            } else {
                return { ...prev, ratings: [...prev.ratings, rating] }
            }
        })
    }

    const setDateRange = (range: FilterConditions['dateRange']) => {
        setTempConditions(prev => ({ ...prev, dateRange: range }))
    }

    const handleApply = () => {
        setConditions(tempConditions)
        onFilterChange(tempConditions)
        setIsOpen(false)
    }

    const handleReset = () => {
        const defaultConditions: FilterConditions = {
            replyStatus: ['unreplied', 'replied'],
            ratings: [5, 4, 3, 2, 1],
            dateRange: 'all',
            customStartDate: '',
            customEndDate: ''
        }
        setTempConditions(defaultConditions)
    }

    // 現在のアクティブなフィルター数をカウント（バッジ用）
    const getActiveCount = () => {
        let count = 0
        if (conditions.replyStatus.length < 2) count++ // どちらかのみ選択時
        if (conditions.ratings.length < 5) count++ // 一部のみ選択時
        if (conditions.dateRange !== 'all') count++
        return count
    }

    return (
        <div className="bg-background rounded-lg border shadow-sm mb-4 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-muted/10 hover:bg-muted/20 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground/80">絞り込みをする</span>
                    {getActiveCount() > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {getActiveCount()}
                        </span>
                    )}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {isOpen && (
                <div className="p-4 space-y-6 border-t bg-card">
                    {/* ビジネスアカウント (モック) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">ビジネスアカウント</label>
                        <div>
                            <Button variant="outline" className="w-full justify-start text-muted-foreground" disabled>
                                <span className="mr-2">⚡</span> 全てのビジネスアカウント
                            </Button>
                        </div>
                    </div>

                    {/* 返信状況 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">返信状況</label>
                        <div className="flex flex-wrap gap-2">
                            <FilterChip
                                label="未返信"
                                active={tempConditions.replyStatus.includes('unreplied')}
                                onClick={() => toggleReplyStatus('unreplied')}
                            />
                            <FilterChip
                                label="返信済み"
                                active={tempConditions.replyStatus.includes('replied')}
                                onClick={() => toggleReplyStatus('replied')}
                            />
                        </div>
                    </div>

                    {/* クチコミ評価 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">クチコミ評価</label>
                        <div className="flex flex-wrap gap-2">
                            {[5, 4, 3, 2, 1].map(rating => (
                                <FilterChip
                                    key={rating}
                                    label={`★ ${rating}`}
                                    active={tempConditions.ratings.includes(rating)}
                                    onClick={() => toggleRating(rating)}
                                    color="amber"
                                />
                            ))}
                        </div>
                    </div>

                    {/* 投稿日 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">投稿日</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {[
                                { label: '全期間', value: 'all' },
                                { label: '1週間', value: '1week' },
                                { label: '1ヶ月', value: '1month' },
                                { label: '3ヶ月', value: '3months' }, // 4半期
                                { label: '半年', value: '6months' },
                                { label: '1年', value: '1year' },
                            ].map((item) => (
                                <FilterChip
                                    key={item.value}
                                    label={item.label}
                                    active={tempConditions.dateRange === item.value}
                                    onClick={() => setDateRange(item.value as any)}
                                />
                            ))}
                        </div>

                        {/* カスタム期間 (シンプルにInput dateを使用) */}
                        <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-md">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">カスタム:</span>
                            <input
                                type="date"
                                className="bg-transparent border rounded px-2 py-1 text-sm w-full"
                                value={tempConditions.customStartDate}
                                onChange={(e) => setTempConditions(prev => ({ ...prev, dateRange: 'custom', customStartDate: e.target.value }))}
                            />
                            <span className="text-muted-foreground">-</span>
                            <input
                                type="date"
                                className="bg-transparent border rounded px-2 py-1 text-sm w-full"
                                value={tempConditions.customEndDate}
                                onChange={(e) => setTempConditions(prev => ({ ...prev, dateRange: 'custom', customEndDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex items-center justify-between pt-4 border-t gap-3">
                        <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
                            リセット
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                                キャンセル
                            </Button>
                            <Button size="sm" onClick={handleApply}>
                                設定する
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function FilterChip({ label, active, onClick, color = 'primary' }: { label: string, active: boolean, onClick: () => void, color?: 'primary' | 'amber' }) {
    const activeClass = color === 'primary'
        ? 'bg-primary/10 border-primary text-primary'
        : 'bg-amber-100 border-amber-400 text-amber-700'

    return (
        <button
            onClick={onClick}
            className={`
                px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5
                ${active ? activeClass : 'bg-background border-border text-muted-foreground hover:bg-muted/50'}
            `}
        >
            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${active ? (color === 'primary' ? 'bg-primary border-primary' : 'bg-amber-500 border-amber-500') : 'border-muted-foreground'}`}>
                {active && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
            </div>
            {label}
        </button>
    )
}
