import { useInfiniteQuery } from '@tanstack/react-query'

import { DEFAULT_PAGE_SIZE, getNextPageParam } from '@/shared/api/pagination'

import { getReceivedLikes } from '../api/userService'
import { usersQueryKeys } from '../lib/usersQueryKeys'
import type { UserSearchApiUser } from '../types/types'

export function useReceivedLikes(pageSize: number = DEFAULT_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: usersQueryKeys.receivedLikes(pageSize),
    queryFn: ({ pageParam }) => getReceivedLikes(pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function flattenLikesPages(
  data: { pages: Array<{ items: UserSearchApiUser[] }> } | undefined,
): UserSearchApiUser[] {
  if (!data) {
    return []
  }
  return data.pages.flatMap((page) => page.items)
}
