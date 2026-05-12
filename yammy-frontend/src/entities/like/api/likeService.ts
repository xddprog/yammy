import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'

const LIKES_BASE = 'api/v1/likes'

export async function sendUserLike(userToId: string): Promise<void> {
  const response = await authApi.post(`${LIKES_BASE}/`, {
    searchParams: { user_to_id: userToId },
  })
  if (!response.ok) {
    await throwApiError(response, 'Лайк')
  }
}

export async function sendUserDislike(userToId: string): Promise<void> {
  const response = await authApi.post(`${LIKES_BASE}/dislike`, {
    searchParams: { user_to_id: userToId },
  })
  if (!response.ok) {
    await throwApiError(response, 'Дизлайк')
  }
}
