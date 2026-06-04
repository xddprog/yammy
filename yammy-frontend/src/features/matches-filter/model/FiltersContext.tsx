import type React from 'react'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { useFiltersMetadata } from '@/entities/user/hooks/useFiltersMetadata'

import {
  clearPersistedFeedFilters,
  extractPersistedFeedFilters,
  loadAppliedFiltersState,
  savePersistedFeedFilters,
} from '../lib/persistedFeedFilters'
import { reconcileFiltersStateWithMetadata } from '../lib/reconcileFeedFiltersWithMetadata'
import type { FiltersState } from './types'
import { getDefaultFiltersState } from './types'

export interface FiltersContextValue {
  /** Черновик в оверлее (до «Применить»). */
  state: FiltersState
  /** Применённые фильтры — лента и localStorage. */
  appliedState: FiltersState
  setState: React.Dispatch<React.SetStateAction<FiltersState>>
  setGender: (v: FiltersState['gender']) => void
  setAgeRange: (v: [number, number]) => void
  setCity: (v: string) => void
  setFilterValue: (categorySlug: string, subcategorySlug: string, values: string[]) => void
  setRelationshipGoals: (v: FiltersState['relationshipGoals']) => void
  setWorkFields: (v: FiltersState['workFields']) => void
  setEducationLevel: (v: FiltersState['educationLevel']) => void
  setEducationInstitution: (v: string) => void
  setPriorities: (v: [number, number, number]) => void
  /** Черновик → applied + localStorage (кнопка «Применить»). */
  persist: (snapshot?: FiltersState) => void
  reset: () => void
}

const FiltersContext = createContext<FiltersContextValue | null>(null)

export { FiltersContext }

function useDraftSetters(
  setState: React.Dispatch<React.SetStateAction<FiltersState>>,
): Omit<FiltersContextValue, 'state' | 'appliedState' | 'setState' | 'persist' | 'reset'> {
  const setGender = useCallback(
    (v: FiltersState['gender']) => {
      setState((s) => ({ ...s, gender: v }))
    },
    [setState],
  )
  const setAgeRange = useCallback(
    (v: [number, number]) => {
      setState((s) => ({ ...s, ageRange: v }))
    },
    [setState],
  )
  const setCity = useCallback(
    (v: string) => {
      setState((s) => ({ ...s, city: v }))
    },
    [setState],
  )
  const setFilterValue = useCallback(
    (categorySlug: string, subcategorySlug: string, values: string[]) => {
      setState((s) => ({
        ...s,
        filters: {
          ...s.filters,
          [categorySlug]: {
            ...(s.filters?.[categorySlug] ?? {}),
            [subcategorySlug]: values,
          },
        },
      }))
    },
    [setState],
  )
  const setRelationshipGoals = useCallback(
    (v: FiltersState['relationshipGoals']) => {
      setState((s) => ({ ...s, relationshipGoals: v }))
    },
    [setState],
  )
  const setWorkFields = useCallback(
    (v: FiltersState['workFields']) => {
      setState((s) => ({
        ...s,
        workFields: v,
        job: v.length === 0 ? '' : s.job,
      }))
    },
    [setState],
  )
  const setEducationLevel = useCallback(
    (v: FiltersState['educationLevel']) => {
      setState((s) => ({ ...s, educationLevel: v }))
    },
    [setState],
  )
  const setEducationInstitution = useCallback(
    (v: string) => {
      setState((s) => ({ ...s, educationInstitution: v }))
    },
    [setState],
  )
  const setPriorities = useCallback(
    (v: [number, number, number]) => {
      setState((s) => ({ ...s, priorities: v }))
    },
    [setState],
  )

  return useMemo(
    () => ({
      setGender,
      setAgeRange,
      setCity,
      setFilterValue,
      setRelationshipGoals,
      setWorkFields,
      setEducationLevel,
      setEducationInstitution,
      setPriorities,
    }),
    [
      setGender,
      setAgeRange,
      setCity,
      setFilterValue,
      setRelationshipGoals,
      setWorkFields,
      setEducationLevel,
      setEducationInstitution,
      setPriorities,
    ],
  )
}

export function FiltersProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { data: filtersMetadata } = useFiltersMetadata()

  const [state, setState] = useState<FiltersState>(() => loadAppliedFiltersState())
  const [appliedState, setAppliedState] = useState<FiltersState>(() => loadAppliedFiltersState())

  const setters = useDraftSetters(setState)

  useEffect(() => {
    if (!filtersMetadata?.length) return

    setAppliedState((prev) => {
      const next = reconcileFiltersStateWithMetadata(prev, filtersMetadata)
      const unchanged =
        JSON.stringify(extractPersistedFeedFilters(prev)) ===
        JSON.stringify(extractPersistedFeedFilters(next))
      if (unchanged) return prev
      savePersistedFeedFilters(next)
      return next
    })
  }, [filtersMetadata])

  const persist = useCallback((snapshot?: FiltersState) => {
    if (snapshot != null) {
      setAppliedState(snapshot)
      setState(snapshot)
      savePersistedFeedFilters(snapshot)
      return
    }
    setState((draft) => {
      setAppliedState(draft)
      savePersistedFeedFilters(draft)
      return draft
    })
  }, [])

  const reset = useCallback(() => {
    const defaults = getDefaultFiltersState()
    setState(defaults)
    setAppliedState(defaults)
    clearPersistedFeedFilters()
  }, [])

  const value = useMemo<FiltersContextValue>(
    () => ({
      state,
      appliedState,
      setState,
      ...setters,
      persist,
      reset,
    }),
    [state, appliedState, setters, persist, reset],
  )

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}
