import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'
import type { UserSearchApiUser } from '@/entities/user/types/types'

import type {
  AiSearchFeedData,
  AiSearchHistoryList,
  AiSearchJob,
  AiSearchJobStatus,
} from '../types'
import type { AiSearchCreatePayload, AiSearchTargetGender } from '../lib/aiSearchGender'

const AI_SEARCH_HISTORY_ENDPOINT = 'api/v1/users/search/ai/history'

type AiSearchHistoryApiItem = {
  id: string
  query_text: string
  target_gender: AiSearchTargetGender | null
  status: AiSearchJobStatus
  result_count: number | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

type AiSearchFeedApiResponse = {
  items: Array<{
    user: UserSearchApiUser
    highlights: string
    match_percentage: number
  }>
}

function truncateTitle(queryText: string, max = 40): string {
  const trimmed = queryText.trim()
  if (!trimmed) return 'Поиск без пожеланий'
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`
}

function mapHistoryItem(item: AiSearchHistoryApiItem): AiSearchJob {
  const queryText = item.query_text ?? ''
  return {
    id: item.id,
    title: truncateTitle(queryText),
    queryText,
    targetGender: item.target_gender,
    status: item.status,
    createdAt: item.created_at,
    completedAt: item.completed_at,
    errorMessage: item.error_message,
    resultCount: item.result_count,
  }
}

export async function listAiSearchJobs(): Promise<AiSearchHistoryList> {
  const response = await authApi.get(AI_SEARCH_HISTORY_ENDPOINT)
  if (!response.ok) {
    await throwApiError(response, 'Ошибка загрузки истории AI-поиска')
  }
  const data = (await response.json()) as {
    items: AiSearchHistoryApiItem[]
    remaining_today: number
  }
  return {
    jobs: data.items.map(mapHistoryItem),
    remainingToday: data.remaining_today,
  }
}

export async function getAiSearchJob(id: string): Promise<AiSearchJob | null> {
  const response = await authApi.get(`${AI_SEARCH_HISTORY_ENDPOINT}/${id}`)
  if (response.status === 404) return null
  if (!response.ok) {
    await throwApiError(response, 'Ошибка загрузки запуска AI-поиска')
  }
  const data = (await response.json()) as AiSearchHistoryApiItem
  return mapHistoryItem(data)
}

export async function createAiSearchJob(payload: AiSearchCreatePayload): Promise<AiSearchJob> {
  const response = await authApi.post(AI_SEARCH_HISTORY_ENDPOINT, {
    json: payload,
  })
  if (!response.ok) {
    await throwApiError(response, 'Не удалось запустить AI-поиск')
  }
  const data = (await response.json()) as AiSearchHistoryApiItem
  return mapHistoryItem(data)
}

export async function getAiSearchFeed(jobId: string): Promise<AiSearchFeedData> {
  const response = await authApi.get(`${AI_SEARCH_HISTORY_ENDPOINT}/${jobId}/feed`)
  if (response.status === 409) {
    return { users: [], highlights: {} }
  }
  if (!response.ok) {
    await throwApiError(response, 'Ошибка загрузки AI-ленты')
  }
  const data = (await response.json()) as AiSearchFeedApiResponse
  const highlights: Record<string, string> = {}
  const users = data.items.map((item) => {
    highlights[item.user.user_id] = item.highlights
    return {
      ...item.user,
      match_percentage: item.match_percentage,
    }
  })
  return { users, highlights }
}

export function hasActiveAiSearchJobs(jobs: AiSearchJob[] | undefined): boolean {
  return (jobs ?? []).some((job) => job.status === 'searching')
}
