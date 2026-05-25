import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'
import type { PaginatedResponse } from '@/shared/api/pagination'

import type { ChatListItemDto } from '../types/types'

const CHATS_BASE = 'api/v1/chats'

export async function fetchChatsList(
  page: number,
  size: number,
): Promise<PaginatedResponse<ChatListItemDto>> {
  const response = await authApi.get(`${CHATS_BASE}/`, {
    searchParams: { page, size },
  })
  if (!response.ok) {
    await throwApiError(response, 'Ошибка загрузки чатов')
  }
  return response.json() as Promise<PaginatedResponse<ChatListItemDto>>
}
