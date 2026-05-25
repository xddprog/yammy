import type { UserLanguage } from '@/entities/user/types/types'

export type SubscriptionTier = 'free' | 'premium' | 'vip'

export interface CurrentUser {
  id: string
  language: UserLanguage
  is_banned: boolean
  subscription_tier: SubscriptionTier
  subscription_expires_at: string | null
  has_active_subscription: boolean
  has_active_boost: boolean
  superlikes_balance: number
  boosts_balance: number
}
