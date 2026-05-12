import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'

import type { AppearanceRatingUserDto } from '../types/types'

const APPEARANCE_RATINGS_BASE = 'api/v1/appearance-ratings'

export async function getAppearanceRatingUsers(): Promise<AppearanceRatingUserDto[]> {
  const response = await authApi.get(APPEARANCE_RATINGS_BASE)
  if (!response.ok) {
    await throwApiError(response, 'Загрузка анкет для оценки')
  }
  return response.json() as Promise<AppearanceRatingUserDto[]>
}

export async function sendAppearanceRating(ratedUserId: string, score: number): Promise<void> {
  const response = await authApi.post(APPEARANCE_RATINGS_BASE, {
    json: { rated_user_id: ratedUserId, score },
  })
  if (!response.ok) {
    await throwApiError(response, 'Оценка внешности')
  }
}
