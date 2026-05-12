import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { getAppearanceRatingUsers } from '../api/appearanceRatingService'
import { usersQueryKeys } from '../lib/usersQueryKeys'
import type { AppearanceRatingUserDto } from '../types/types'

export function useAppearanceRatingUsers(
  options?: Omit<
    UseQueryOptions<
      AppearanceRatingUserDto[],
      Error,
      AppearanceRatingUserDto[],
      ReturnType<typeof usersQueryKeys.appearanceRating>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: usersQueryKeys.appearanceRating(),
    queryFn: () => getAppearanceRatingUsers(),
    ...options,
  })
}
