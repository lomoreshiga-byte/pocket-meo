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
    const [conditions, setConditions] = useState<FilterConditions>(initialConditions || {
        replyStatus: ['unreplied'],
        ratings: [5, 4, 3, 2, 1],
        dateRange: 'all',
        customStartDate: '',
        customEndDate: ''
    })

    // フィルター変更時に即時反映
    const updateConditions = (newConditions: FilterConditions) => {
        setConditions(newConditions)
        onFilterChange(newConditions)
    }

    const toggleReplyStatus = (status: 'unreplied' | 'replied') => {
        const exists = conditions.replyStatus.includes(status)
        let newStatus
        if (exists) {
            newStatus = conditions.replyStatus.filter(s => s !== status)
        } else {
            newStatus = [...conditions.replyStatus, status]
        }
        updateConditions({ ...conditions, replyStatus: newStatus })
    }

    const toggleRating = (rating: number) => {
        const exists = conditions.ratings.includes(rating)
        let newRatings
        if (exists) {
            newRatings = conditions.ratings.filter(r => r !== rating)
        } else {
            newRatings = [...conditions.ratings, rating]
        }
        updateConditions({ ...conditions, ratings: newRatings })
    }

    const setDateRange = (range: FilterConditions['dateRange']) => {
        updateConditions({ ...conditions, dateRange: range })
    }

    const setCustomDate = (key: 'customStartDate' | 'customEndDate', value: string) => {
        updateConditions({ ...conditions, dateRange: 'custom', [key]: value })
    }

    const handleReset = () => {
        const defaultConditions: FilterConditions = {
            replyStatus: ['unreplied', 'replied'],
            ratings: [5, 4, 3, 2, 1],
            dateRange: 'all',
            customStartDate: '',
            customEndDate: ''
        }
        updateConditions(defaultConditions)
    }

    return (
        <div className="bg-card rounded-lg border shadow-sm mb-4">
            <div className="p-4 border-b bg-muted/10 flex justify-between items-center">
                <span className="font-bold text-sm text-foreground/80">絞り込み条件</span>
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground">
                    リセット
                </Button>
            </div>

            <div className="p-4 space-y-6">
                {/* 返信状況 */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">返信状況</label>
                    <div className="flex flex-wrap gap-2">
                        <FilterChip
                            label="未返信"
                            active={conditions.replyStatus.includes('unreplied')}
                            onClick={() => toggleReplyStatus('unreplied')}
                        />
                        <FilterChip
                            label="返信済み"
                            active={conditions.replyStatus.includes('replied')}
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
                                active={conditions.ratings.includes(rating)}
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
                            { label: '3ヶ月', value: '3months' },
                            { label: '半年', value: '6months' },
                            { label: '1年', value: '1year' },
                        ].map((item) => (
                            <FilterChip
                                key={item.value}
                                label={item.label}
                                active={conditions.dateRange === item.value}
                                onClick={() => setDateRange(item.value as any)}
                            />
                        ))}
                    </div>

                    {/* カスタム期間 */}
                    <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-md">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">カスタム:</span>
                        <input
                            type="date"
                            className="bg-transparent border rounded px-2 py-1 text-sm w-full"
                            value={conditions.customStartDate}
                            onChange={(e) => setCustomDate('customStartDate', e.target.value)}
                        />
                        <span className="text-muted-foreground">-</span>
                        <input
                            type="date"
                            className="bg-transparent border rounded px-2 py-1 text-sm w-full"
                            value={conditions.customEndDate}
                            onChange={(e) => setCustomDate('customEndDate', e.target.value)}
                        />
                    </div>
                </div>
            </div>
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
