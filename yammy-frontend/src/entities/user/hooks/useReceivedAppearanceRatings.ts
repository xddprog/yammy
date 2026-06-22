import { useInfiniteQuery } from '@tanstack/react-query'

import { getReceivedAppearanceRatings } from '@/entities/user/api/appearanceRatingService'
import { DEFAULT_PAGE_SIZE, getNextPageParam } from '@/shared/api/pagination'

import { usersQueryKeys } from '../lib/usersQueryKeys'
import type { AppearanceRatingReceivedItem } from '../types/types'

export function useReceivedAppearanceRatings(
  pageSize: number = DEFAULT_PAGE_SIZE,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: usersQueryKeys.receivedAppearanceRatings(pageSize),
    queryFn: ({ pageParam }) => getReceivedAppearanceRatings(pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 0,
    refetchOnMount: 'always',
    enabled: options?.enabled ?? true,
  })
}

export function flattenAppearanceRatingsPages(
  data: { pages: Array<{ items: AppearanceRatingReceivedItem[] }> } | undefined,
): AppearanceRatingReceivedItem[] {
  if (!data) {
    return []
  }
  return data.pages.flatMap((page) => page.items)
}
