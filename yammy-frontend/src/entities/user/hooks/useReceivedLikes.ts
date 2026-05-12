import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { getReceivedLikes } from '../api/userService'
import { usersQueryKeys } from '../lib/usersQueryKeys'
import type { UserSearchApiUser } from '../types/types'

export function useReceivedLikes(
  options?: Omit<
    UseQueryOptions<
      UserSearchApiUser[],
      Error,
      UserSearchApiUser[],
      ReturnType<typeof usersQueryKeys.receivedLikes>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const query = useQuery({
    queryKey: usersQueryKeys.receivedLikes(),
    queryFn: () => getReceivedLikes(),
    staleTime: 60 * 1000,
    ...options,
  })

  return query
}
