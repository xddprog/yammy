import isEqual from 'lodash/isEqual'
import type React from 'react'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAuthSession } from '@/entities/token/hooks/useAuthSession'
import { useFiltersMetadata } from '@/entities/user/hooks/useFiltersMetadata'
import { useUserProfile } from '@/entities/user/hooks/useUserProfile'

import {
  clearPersistedFeedFilters,
  extractPersistedFeedFilters,
  loadAppliedFiltersState,
  loadPersistedFeedFilters,
  savePersistedFeedFilters,
} from '../lib/persistedFeedFilters'
import { reconcileFiltersStateWithMetadata } from '../lib/reconcileFeedFiltersWithMetadata'
import { getOppositeSearchGender } from '../lib/searchGenderDefaults'
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
  setSearchText: (v: string) => void
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
  const setSearchText = useCallback(
    (v: string) => {
      setState((s) => ({ ...s, searchText: v }))
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
      setSearchText,
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
      setSearchText,
      setFilterValue,
      setRelationshipGoals,
      setWorkFields,
      setEducationLevel,
      setEducationInstitution,
      setPriorities,
    ],
  )
}

function mergeDraftFields(next: FiltersState, draft: FiltersState): FiltersState {
  return {
    ...next,
    bio: draft.bio,
    job: draft.job,
  }
}

function persistedFeedFiltersEqual(left: FiltersState, right: FiltersState): boolean {
  return isEqual(extractPersistedFeedFilters(left), extractPersistedFeedFilters(right))
}

export function FiltersProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { hasToken, isOnboarding } = useAuthSession()
  const canLoadUserProfile = hasToken && !isOnboarding
  const { data: filtersMetadata, dataUpdatedAt: filtersMetadataUpdatedAt } = useFiltersMetadata({
    enabled: hasToken,
  })
  const { data: profile } = useUserProfile({ enabled: canLoadUserProfile })
  const profileDefaultsAppliedRef = useRef(false)
  const metadataSyncedAtRef = useRef('')
  const filtersMetadataRef = useRef(filtersMetadata)
  if (filtersMetadata?.length) {
    filtersMetadataRef.current = filtersMetadata
  }

  const [state, setState] = useState<FiltersState>(() => loadAppliedFiltersState())
  const [appliedState, setAppliedState] = useState<FiltersState>(() => loadAppliedFiltersState())
  const appliedStateRef = useRef(appliedState)
  appliedStateRef.current = appliedState

  const setters = useDraftSetters(setState)

  useEffect(() => {
    const metadata = filtersMetadataRef.current
    if (!metadata?.length) return

    const hasPersisted = loadPersistedFeedFilters() != null
    let working = appliedStateRef.current

    if (!hasPersisted && profile?.gender && !profileDefaultsAppliedRef.current) {
      working = getDefaultFiltersState(getOppositeSearchGender(profile.gender))
      profileDefaultsAppliedRef.current = true
    } else if (hasPersisted) {
      profileDefaultsAppliedRef.current = true
    }

    const reconciled = reconcileFiltersStateWithMetadata(working, metadata)
    const syncKey = `${filtersMetadataUpdatedAt}:${profile?.gender ?? ''}`

    if (metadataSyncedAtRef.current === syncKey) {
      return
    }
    metadataSyncedAtRef.current = syncKey

    if (persistedFeedFiltersEqual(appliedStateRef.current, reconciled)) {
      return
    }

    savePersistedFeedFilters(reconciled)
    setAppliedState(reconciled)
    setState((draft) => mergeDraftFields(reconciled, draft))
  }, [filtersMetadataUpdatedAt, profile?.gender])

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
    const defaults = getDefaultFiltersState(
      profile?.gender ? getOppositeSearchGender(profile.gender) : null,
    )
    setState(defaults)
    setAppliedState(defaults)
    clearPersistedFeedFilters()
  }, [profile?.gender])

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
