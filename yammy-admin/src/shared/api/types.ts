export type Paginated<T> = {
  total: number
  page: number
  size: number
  items: T[]
}

export type AdminUserPreview = {
  id: string
  name: string
  age: number
  city: string
  is_banned: boolean
  subscription_tier: string
  profile_moderation_approved: boolean
  last_seen: string
  created_at: string | null
  main_photo: string | null
}

export type AdminUserStats = {
  received_likes_count: number
  matches_count: number
  profile_views_count: number
  sent_likes_count: number
  reports_received_count: number
  reports_sent_count: number
  messages_sent_count: number
  ai_search_jobs_count: number
}

export type AdminUserDetail = AdminUserPreview & {
  telegram_id: number
  gender: string
  bio: string | null
  relationship_goal: string
  subscription_expires_at: string | null
  superlikes_balance: number
  boosts_balance: number
  boost_expires_at: string | null
  photos: Array<{ id: string; file_path: string; order: number; is_main: boolean }>
  stats: AdminUserStats
}

export type AdminReportItem = {
  id: string
  reason: string
  comment: string | null
  status: string
  created_at: string | null
  reviewed_at: string | null
  review_note: string | null
  reporter_id: string
  reporter_name: string
}

export type ReportedUserItem = {
  user: AdminUserPreview
  total_reports_count: number
  pending_reports_count: number
  last_report_at: string | null
}

export type ReportedUserDetail = {
  user: AdminUserDetail
  reports: AdminReportItem[]
}

export type FilterDeleteResult = {
  affected_users: number
  reindexed_users: number
}

export type FilterCategory = {
  id: string
  slug: string
  name: string
  subcategories: Array<{
    id: string
    slug: string
    name: string
    options: Array<{ id: string; slug: string; name: string }>
  }>
}

export type AdminUserChat = {
  has_chat: boolean
  chat_id: string | null
  messages: Array<{
    id: string
    sender_id: string
    sender_name: string
    content: string
    created_at: string | null
    is_deleted: boolean
    is_edited: boolean
    images: Array<{ id: string; file_path: string; order: number }>
  }>
}

export type StatsOverview = {
  period_days: number
  date_from: string | null
  date_to: string | null
  cards: {
    total_users: number
    new_users_period: number
    dau: number
    wau: number
    mau: number
    total_matches: number
    messages_period: number
    reports_period: number
  }
  growth: { registrations: Array<{ date: string; value: number }> }
  engagement: {
    likes: Array<{ date: string; value: number }>
    matches: Array<{ date: string; value: number }>
    messages: Array<{ date: string; value: number }>
  }
  monetization: {
    tier_free: number
    tier_vip: number
    tier_premium: number
    revenue_period: number
    revenue_total: number
    payments_count_period: number
    revenue_by_day: Array<{ date: string; value: number }>
  }
  ai_search: { searching: number; ready: number; failed: number; avg_result_count: number }
  safety: { reports_by_reason: Record<string, number>; banned_users: number }
  pending_moderation: number
}
