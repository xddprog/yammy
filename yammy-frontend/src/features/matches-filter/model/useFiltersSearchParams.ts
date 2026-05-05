import { useMemo } from 'react'

import type { SearchUsersRequest } from '@/entities/user/types/types'

import { mapFiltersToSearchRequest } from './mapFiltersToSearchRequest'
import { useFiltersState } from './useFiltersState'

/** Возвращает параметры поиска пользователей из применённых фильтров (обновляются только при «Применить» / «Сбросить»). */
export function useFiltersSearchParams(): SearchUsersRequest {
  const { appliedState } = useFiltersState()
  return useMemo(() => mapFiltersToSearchRequest(appliedState), [appliedState])
}
