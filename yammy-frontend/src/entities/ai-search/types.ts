import type { UserSearchApiUser } from '@/entities/user/types/types'

import type { AiSearchTargetGender } from './lib/aiSearchGender'

/** Статусы job (контракт для будущего API). */
export type AiSearchJobStatus =
  | 'queued'
  | 'parsing'
  | 'searching'
  | 'ready'
  | 'failed'
  | 'cancelled'

/** Распознанные фильтры после LLM (упрощённый preview / apply). */
export interface ParsedSearchPreview {
  gender?: AiSearchTargetGender | null
  ageMin?: number | null
  ageMax?: number | null
  city?: string | null
  relationshipGoal?: string | null
}

export interface AiSearchJob {
  id: string
  title: string
  queryText: string
  targetGender?: AiSearchTargetGender | null
  status: AiSearchJobStatus
  createdAt: string
  completedAt?: string | null
  appliedAt?: string | null
  errorMessage?: string | null
  parsed?: ParsedSearchPreview | null
  resultCount?: number | null
}

export interface AiSearchFeedData {
  users: UserSearchApiUser[]
  highlights: Record<string, string>
}

export interface AiSearchHistoryList {
  jobs: AiSearchJob[]
  remainingToday: number
}
