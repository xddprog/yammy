import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { getUserProfile } from '../api/userService'
import { usersQueryKeys } from '../lib/usersQueryKeys'
import type { UserProfileDto } from '../types/types'

export function useUserProfile(
  options?: Omit<
    UseQueryOptions<UserProfileDto, Error, UserProfileDto, ReturnType<typeof usersQueryKeys.profile>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: usersQueryKeys.profile(),
    queryFn: () => getUserProfile(),
    staleTime: 60_000,
    ...options,
  })
}
