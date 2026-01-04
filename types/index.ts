export interface User {
    id: string
    email: string
    gbpLocationId?: string
    instagramAccountId?: string
    createdAt: Date
}

export interface Review {
    id: string
    userId: string
    gbpReviewId: string
    reviewerName: string
    reviewerPhotoUrl?: string
    rating: number
    comment: string
    replied: boolean
    replyText?: string
    createdAt: Date
    repliedAt?: Date
}

export interface Post {
    id: string
    userId: string
    content: string
    imageUrl?: string
    platform: 'gbp' | 'instagram' | 'both'
    status: 'draft' | 'scheduled' | 'published'
    scheduledAt?: Date
    publishedAt?: Date
    createdAt: Date
}

export interface GBPInfo {
    id: string
    userId: string
    businessHours: BusinessHours
    isTemporarilyClosed: boolean
    updatedAt: Date
}

export interface BusinessHours {
    monday?: DayHours
    tuesday?: DayHours
    wednesday?: DayHours
    thursday?: DayHours
    friday?: DayHours
    saturday?: DayHours
    sunday?: DayHours
}

export interface DayHours {
    open: string // "09:00"
    close: string // "18:00"
    closed?: boolean
}

export type ReplyTone = 'grateful' | 'apologetic' | 'friendly'

export interface AIReplyRequest {
    reviewText: string
    rating: number
    tone: ReplyTone
}

export interface AIReplyResponse {
    reply: string
}
