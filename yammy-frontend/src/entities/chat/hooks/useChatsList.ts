import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { DEFAULT_PAGE_SIZE, getNextPageParam } from '@/shared/api/pagination'

import { fetchChatsList } from '../api/chatService'
import { chatsQueryKeys } from '../lib/chatsQueryKeys'
import type { ChatListItem } from '../types/types'
import { mapChatListItem } from '../lib/mapChatListItem'

const DEBOUNCE_MS = 300

export function useChatsList(search = '', pageSize: number = DEFAULT_PAGE_SIZE) {
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [search])

  const trimmedSearch = debouncedSearch.trim()
  const trimmedInput = search.trim()
  const isSearchDebouncing = trimmedInput.length > 0 && trimmedInput !== trimmedSearch

  const query = useInfiniteQuery({
    queryKey: chatsQueryKeys.list(pageSize, trimmedSearch),
    queryFn: async ({ pageParam }) => {
      const page = await fetchChatsList(pageParam, pageSize, trimmedSearch || undefined)
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

  const isSearchLoading =
    trimmedInput.length > 0 &&
    (isSearchDebouncing ||
      query.isPending ||
      (query.isFetching && !query.isFetchingNextPage))

  return {
    ...query,
    isSearchLoading,
  }
}

export function flattenChatsPages(
  data: { pages: Array<{ items: ChatListItem[] }> } | undefined,
): ChatListItem[] {
  if (!data) {
    return []
  }
  return data.pages.flatMap((page) => page.items)
}
