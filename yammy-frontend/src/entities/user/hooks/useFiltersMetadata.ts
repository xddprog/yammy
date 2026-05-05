import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { getFilters } from '../api/userService'
import { usersQueryKeys } from '../lib/usersQueryKeys'
import type { FiltersMetadataResponse } from '../types/types'

export function useFiltersMetadata(
  options?: Omit<
    UseQueryOptions<
      FiltersMetadataResponse,
      Error,
      FiltersMetadataResponse,
      ReturnType<typeof usersQueryKeys.filters>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: usersQueryKeys.filters(),
    queryFn: () => getFilters(),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
