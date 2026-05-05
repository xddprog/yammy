export interface CurrentUser {
  id: string
  name: string
  age: number
  gender: string
  city: string
  bio: string
  job: string
  job_sphere: string
  education_level: string
  education_details: string
  relationship_goal: string
  subscription_tier: string
  subscription_expires_at: string | null
  boost_expires_at: string | null
  boosts_balance: number
  superlikes_balance: number
  adequacy_score: number
  activity_score: number
  referral_code: string
  referred_by_id: string | null
  telegram_id: number
  last_seen: string | null
  is_banned: boolean
  created_at: string
  updated_at: string
}
