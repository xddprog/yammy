import { useContext } from 'react'

import { FiltersContext } from './FiltersContext'

const FILTERS_PROVIDER_MISSING =
  'useFiltersState вызывается вне FiltersProvider. Оберните дерево в <FiltersProvider>.'

/** Хук доступа к глобальному состоянию фильтров из контекста. */
export function useFiltersState() {
  const context = useContext(FiltersContext)
  if (context == null) {
    throw new Error(FILTERS_PROVIDER_MISSING)
  }
  return context
}
