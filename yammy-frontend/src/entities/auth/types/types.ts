import type { UserLanguage } from '@/entities/user/types/types'

export interface CurrentUser {
  id: string
  language: UserLanguage
  is_banned: boolean
  has_active_subscription: boolean
  has_active_boost: boolean
  superlikes_balance: number
  boosts_balance: number
}
