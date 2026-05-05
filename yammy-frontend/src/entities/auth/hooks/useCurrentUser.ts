import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { getCurrentUser } from '../api/authService'
import { authQueryKeys } from '../lib/authQueryKeys'
import type { CurrentUser } from '../types/types'

export function useCurrentUser(
  options?: Omit<
    UseQueryOptions<
      CurrentUser,
      Error,
      CurrentUser,
      ReturnType<typeof authQueryKeys.currentUser>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: () => getCurrentUser(),
    ...options,
  })
}
