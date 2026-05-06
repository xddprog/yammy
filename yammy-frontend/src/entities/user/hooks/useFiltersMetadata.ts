import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { getFilters } from '../api/userService'
import { usersQueryKeys } from '../lib/usersQueryKeys'
import { FILTERS_METADATA_FALLBACK_MOCK } from '../mock/apiFallbackMocks'
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
    queryFn: async () => {
      try {
        return await getFilters()
      } catch (error) {
        console.error('Filters API failed, using fallback mock metadata.', error)
        return FILTERS_METADATA_FALLBACK_MOCK
      }
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
