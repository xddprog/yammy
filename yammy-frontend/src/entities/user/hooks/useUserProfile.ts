import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { getUserProfile } from '../api/userService'
import { usersQueryKeys } from '../lib/usersQueryKeys'
import type { UserProfileDto } from '../types/types'

type UserProfileQueryKey = ReturnType<typeof usersQueryKeys.profile>

export function useUserProfile(
  options?: Omit<
    UseQueryOptions<UserProfileDto, Error, UserProfileDto, UserProfileQueryKey>,
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

/** Свежий профиль при каждом заходе на экран «Профиль». */
export function useUserProfileOnProfilePage() {
  return useUserProfile({
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })
}
