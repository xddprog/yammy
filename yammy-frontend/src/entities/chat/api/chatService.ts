import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'
import type { PaginatedResponse } from '@/shared/api/pagination'

import type { ChatListItemDto } from '../types/types'

const CHATS_BASE = 'api/v1/chats'

export async function fetchChatsList(
  page: number,
  size: number,
  q?: string,
): Promise<PaginatedResponse<ChatListItemDto>> {
  const trimmedQuery = q?.trim()
  const searchParams: Record<string, string | number> = { page, size }
  if (trimmedQuery) {
    searchParams.q = trimmedQuery
  }

  const response = await authApi.get(`${CHATS_BASE}/`, {
    searchParams,
  })
  if (!response.ok) {
    await throwApiError(response, 'Ошибка загрузки чатов')
  }
  return response.json() as Promise<PaginatedResponse<ChatListItemDto>>
}
