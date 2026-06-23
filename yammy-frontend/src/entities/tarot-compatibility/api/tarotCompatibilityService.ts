import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'

import type {
  TarotCompatibilityCreatePayload,
  TarotCompatibilityJob,
  TarotCompatibilityJobStatus,
  TarotCompatibilityResult,
  TarotCompatibilityWithPartner,
} from '../types'

const TAROT_COMPATIBILITY_ENDPOINT = 'api/v1/tarot/compatibility'

type TarotCompatibilityApiItem = {
  id: string
  partner_user_id: string
  status: TarotCompatibilityJobStatus
  result_json: TarotCompatibilityResult | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

function mapHistoryItem(item: TarotCompatibilityApiItem): TarotCompatibilityJob {
  return {
    id: item.id,
    partnerUserId: item.partner_user_id,
    status: item.status,
    result: item.result_json,
    errorMessage: item.error_message,
    createdAt: item.created_at,
    completedAt: item.completed_at,
  }
}

export async function getTarotCompatibilityWithPartner(
  partnerUserId: string,
): Promise<TarotCompatibilityWithPartner> {
  const response = await authApi.get(`${TAROT_COMPATIBILITY_ENDPOINT}/with/${partnerUserId}`)
  if (!response.ok) {
    await throwApiError(response, 'Ошибка загрузки расклада')
  }
  const data = (await response.json()) as {
    item: TarotCompatibilityApiItem | null
    remaining_today: number
  }
  return {
    item: data.item ? mapHistoryItem(data.item) : null,
    remainingToday: data.remaining_today,
  }
}

export async function getTarotCompatibilityJob(id: string): Promise<TarotCompatibilityJob | null> {
  const response = await authApi.get(`${TAROT_COMPATIBILITY_ENDPOINT}/${id}`)
  if (response.status === 404) return null
  if (!response.ok) {
    await throwApiError(response, 'Ошибка загрузки расклада')
  }
  const data = (await response.json()) as TarotCompatibilityApiItem
  return mapHistoryItem(data)
}

export async function createTarotCompatibilityJob(
  payload: TarotCompatibilityCreatePayload,
): Promise<TarotCompatibilityJob> {
  const response = await authApi.post(TAROT_COMPATIBILITY_ENDPOINT, {
    json: payload,
  })
  if (!response.ok) {
    await throwApiError(response, 'Не удалось сделать расклад')
  }
  const data = (await response.json()) as TarotCompatibilityApiItem
  return mapHistoryItem(data)
}

export function isTarotCompatibilitySearching(
  item: TarotCompatibilityJob | null | undefined,
): boolean {
  return item?.status === 'searching'
}
