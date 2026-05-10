import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { fetchCityNames } from '../api/citiesApi'

const CITY_NAMES_LIMIT = 20
const DEBOUNCE_MS = 250
const STALE_MS = 120_000

export type UseRemoteSuggestOptions = {
  enabled?: boolean
}

export function useCityNames(search: string, options: UseRemoteSuggestOptions = {}) {
  const { enabled = true } = options
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [search])

  return useQuery({
    queryKey: ['city-names', debouncedSearch] as const,
    queryFn: () => fetchCityNames(debouncedSearch.trim(), CITY_NAMES_LIMIT),
    staleTime: STALE_MS,
    enabled,
    placeholderData: keepPreviousData,
  })
}
