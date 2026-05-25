import { useInfiniteQuery } from '@tanstack/react-query'

import { DEFAULT_PAGE_SIZE, getNextPageParam } from '@/shared/api/pagination'

import { fetchChatsList } from '../api/chatService'
import { chatsQueryKeys } from '../lib/chatsQueryKeys'
import type { ChatListItem } from '../types/types'
import { mapChatListItem } from '../lib/mapChatListItem'

export function useChatsList(pageSize: number = DEFAULT_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: chatsQueryKeys.list(pageSize),
    queryFn: async ({ pageParam }) => {
      const page = await fetchChatsList(pageParam, pageSize)
      return {
        ...page,
        items: page.items.map(mapChatListItem),
      }
    },
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function flattenChatsPages(
  data: { pages: Array<{ items: ChatListItem[] }> } | undefined,
): ChatListItem[] {
  if (!data) {
    return []
  }
  return data.pages.flatMap((page) => page.items)
}
