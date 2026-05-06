import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { getUsersSearch } from '../api/userService'
import { usersQueryKeys } from '../lib/usersQueryKeys'
import { USERS_SEARCH_FALLBACK_MOCK } from '../mock/apiFallbackMocks'
import type { SearchUsersRequest, UserSearchResult } from '../types/types'

export function useUsersSearch(
  params: SearchUsersRequest,
  options?: Omit<
    UseQueryOptions<
      UserSearchResult[],
      Error,
      UserSearchResult[],
      ReturnType<typeof usersQueryKeys.search>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: usersQueryKeys.search(params),
    queryFn: async () => {
      try {
        return await getUsersSearch(params)
      } catch (error) {
        console.error('Users search API failed, using fallback mock data.', error)
        return USERS_SEARCH_FALLBACK_MOCK
      }
    },
    ...options,
  })
}
