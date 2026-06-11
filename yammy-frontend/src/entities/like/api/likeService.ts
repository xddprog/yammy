import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'

const LIKES_BASE = 'api/v1/likes'

type LikeResponse = { message?: string }

export async function sendUserLike(userToId: string): Promise<string | null> {
  const response = await authApi.post(`${LIKES_BASE}/`, {
    searchParams: { user_to_id: userToId },
  })
  if (!response.ok) {
    await throwApiError(response, 'Лайк')
  }
  if (response.status === 204) {
    return null
  }
  const data = (await response.json()) as LikeResponse
  return data.message ?? null
}

export async function sendUserSuperLike(userToId: string, message: string): Promise<string | null> {
  const response = await authApi.post(`${LIKES_BASE}/superlike`, {
    searchParams: { user_to_id: userToId },
    json: { message },
  })
  if (!response.ok) {
    await throwApiError(response, 'Суперлайк')
  }
  if (response.status === 204) {
    return null
  }
  const data = (await response.json()) as LikeResponse
  return data.message ?? null
}

export async function sendUserDislike(userToId: string): Promise<void> {
  const response = await authApi.post(`${LIKES_BASE}/dislike`, {
    searchParams: { user_to_id: userToId },
  })
  if (!response.ok) {
    await throwApiError(response, 'Дизлайк')
  }
}
