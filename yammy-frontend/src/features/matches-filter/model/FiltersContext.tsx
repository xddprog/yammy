import type React from 'react'
import { createContext, useCallback, useMemo, useRef, useState } from 'react'

import {
  clearPersistedFeedFilters,
  getInitialFiltersState,
  savePersistedFeedFilters,
} from '../lib/persistedFeedFilters'
import type { FiltersState } from './types'
import { getDefaultFiltersState } from './types'

export interface FiltersContextValue {
  /** Черновик фильтров (редактируется в overlay). */
  state: FiltersState
  /** Применённые фильтры (используются для запроса поиска; обновляются только при «Применить» или «Сбросить»). */
  appliedState: FiltersState
  setState: React.Dispatch<React.SetStateAction<FiltersState>>
  setGender: (v: FiltersState['gender']) => void
  setAgeRange: (v: [number, number]) => void
  setCity: (v: string) => void
  /** Универсальный сеттер для динамических фильтров по slug'ам категории/подкатегории. */
  setFilterValue: (categorySlug: string, subcategorySlug: string, values: string[]) => void
  setRelationshipGoals: (v: FiltersState['relationshipGoals']) => void
  setWorkFields: (v: FiltersState['workFields']) => void
  setEducationLevel: (v: FiltersState['educationLevel']) => void
  setEducationInstitution: (v: string) => void
  setPriorities: (v: [number, number, number]) => void
  setPremiumOnly: (v: boolean) => void
  /** Зафиксировать черновик как применённый (для запроса ленты; вызывать при «Применить»). */
  persist: () => void
  /** Сбросить к дефолтам в памяти. */
  reset: () => void
}

const FiltersContext = createContext<FiltersContextValue | null>(null)

export { FiltersContext }

function useSetters(
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
  const setPremiumOnly = useCallback(
    (v: boolean) => {
      setState((s) => ({ ...s, premiumOnly: v }))
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
      setPremiumOnly,
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
      setPremiumOnly,
    ],
  )
}

export function FiltersProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [state, setState] = useState<FiltersState>(getInitialFiltersState)
  const [appliedState, setAppliedState] = useState<FiltersState>(getInitialFiltersState)

  const stateRef = useRef(state)
  stateRef.current = state

  const setters = useSetters(setState)

  const persist = useCallback(() => {
    const latest = stateRef.current
    setAppliedState(latest)
    savePersistedFeedFilters(latest)
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
