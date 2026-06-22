import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'
import type { PaginatedResponse } from '@/shared/api/pagination'

import type { AppearanceRatingReceivedItem, AppearanceRatingUserDto } from '../types/types'

const APPEARANCE_RATINGS_BASE = 'api/v1/appearance-ratings'

export async function getAppearanceRatingUsers(): Promise<AppearanceRatingUserDto[]> {
  const response = await authApi.get(APPEARANCE_RATINGS_BASE)
  if (!response.ok) {
    await throwApiError(response, 'Загрузка анкет для оценки')
  }
  return response.json() as Promise<AppearanceRatingUserDto[]>
}

export async function getReceivedAppearanceRatings(
  page: number,
  size: number,
): Promise<PaginatedResponse<AppearanceRatingReceivedItem>> {
  const response = await authApi.get(`${APPEARANCE_RATINGS_BASE}/received`, {
    searchParams: { page, size },
  })
  if (!response.ok) {
    await throwApiError(response, 'Ошибка загрузки оценок')
  }
  return response.json() as Promise<PaginatedResponse<AppearanceRatingReceivedItem>>
}

export async function sendAppearanceRating(ratedUserId: string, score: number): Promise<void> {
  const response = await authApi.post(APPEARANCE_RATINGS_BASE, {
    json: { rated_user_id: ratedUserId, score },
  })
  if (!response.ok) {
    await throwApiError(response, 'Оценка внешности')
  }
}
