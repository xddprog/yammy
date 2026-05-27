/** Статусы job (контракт для будущего API). */
export type AiSearchJobStatus =
  | 'queued'
  | 'parsing'
  | 'searching'
  | 'ready'
  | 'failed'
  | 'cancelled'

export type AiSearchSubscriptionTier = 'free' | 'vip' | 'premium'

/** Распознанные фильтры после LLM (упрощённый preview / apply). */
export interface ParsedSearchPreview {
  gender?: 'male' | 'female' | null
  ageMin?: number | null
  ageMax?: number | null
  city?: string | null
  relationshipGoal?: string | null
}

/** Результат AI-поиска: порядок ленты + подписи к анкетам (хранится на бэке). */
export interface AiSearchJobResults {
  userIds: string[]
  highlights: Record<string, string>
}

export interface AiSearchJob {
  id: string
  title: string
  queryText: string
  status: AiSearchJobStatus
  createdAt: string
  completedAt?: string | null
  appliedAt?: string | null
  errorMessage?: string | null
  parsed?: ParsedSearchPreview | null
  resultCount?: number | null
  results?: AiSearchJobResults | null
}

export interface AiSearchQuota {
  remainingToday: number
  creditsBalance: number
  tier: AiSearchSubscriptionTier
  dailyLimit: number
}
