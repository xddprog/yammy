import { WORK_SPHERE_OPTIONS } from '@/entities/user/constants/profileFieldOptions'

import { AGE_ABSOLUTE_MAX, AGE_ABSOLUTE_MIN } from '../lib/constants'
import type { EducationLevel } from '../model/educationLevel'
import type { FiltersState } from '../model/types'
import { getDefaultFiltersState } from '../model/types'

const STORAGE_KEY = 'yammy_feed_filters_v2'
const WORK_SPHERE_VALUES = new Set<string>(WORK_SPHERE_OPTIONS.map((option) => option.value))

/** Поля ленты поиска (без bio/job — они из профиля на сервере). */
export type PersistedFeedFilters = Pick<
  FiltersState,
  | 'gender'
  | 'ageRange'
  | 'city'
  | 'searchText'
  | 'filters'
  | 'relationshipGoals'
  | 'workFields'
  | 'educationLevel'
  | 'educationInstitution'
  | 'priorities'
>

export function extractPersistedFeedFilters(state: FiltersState): PersistedFeedFilters {
  return {
    gender: state.gender,
    ageRange: state.ageRange,
    city: state.city,
    searchText: state.searchText,
    filters: state.filters,
    relationshipGoals: state.relationshipGoals,
    workFields: state.workFields,
    educationLevel: state.educationLevel,
    educationInstitution: state.educationInstitution,
    priorities: state.priorities,
  }
}

function isEducationLevel(value: unknown): value is EducationLevel {
  return value === 'school' || value === 'college' || value === 'higher'
}

function parseAgeRange(raw: unknown, fallback: [number, number]): [number, number] {
  if (!Array.isArray(raw) || raw.length !== 2) return fallback
  const min = Number(raw[0])
  const max = Number(raw[1])
  if (Number.isNaN(min) || Number.isNaN(max)) return fallback
  const lo = Math.max(AGE_ABSOLUTE_MIN, Math.min(Math.round(min), AGE_ABSOLUTE_MAX))
  const hi = Math.max(AGE_ABSOLUTE_MIN, Math.min(Math.round(max), AGE_ABSOLUTE_MAX))
  return lo <= hi ? [lo, hi] : [hi, lo]
}

function parsePriorities(raw: unknown, fallback: [number, number, number]): [number, number, number] {
  if (!Array.isArray(raw) || raw.length !== 3) return fallback
  const nums = raw.map((n) => Math.round(Number(n)))
  if (nums.some((n) => Number.isNaN(n))) return fallback
  return nums as [number, number, number]
}

function isPersistedFeedFiltersBlob(obj: Record<string, unknown>): boolean {
  return Array.isArray(obj.ageRange)
}

function parsePersistedFilters(raw: unknown): PersistedFeedFilters {
  const defaults = extractPersistedFeedFilters(getDefaultFiltersState())
  if (raw == null || typeof raw !== 'object') return defaults

  const data = raw as Record<string, unknown>

  const gender = data.gender
  const parsedGender =
    gender === 'Мужской' || gender === 'Женский' ? gender : gender === null ? null : defaults.gender

  const educationLevel = data.educationLevel
  const parsedEducation =
    educationLevel === null
      ? null
      : isEducationLevel(educationLevel)
        ? educationLevel
        : defaults.educationLevel

  return {
    gender: parsedGender,
    ageRange: parseAgeRange(data.ageRange, defaults.ageRange),
    city: typeof data.city === 'string' ? data.city : defaults.city,
    searchText: typeof data.searchText === 'string' ? data.searchText : defaults.searchText,
    filters:
      data.filters != null && typeof data.filters === 'object' && !Array.isArray(data.filters)
        ? (data.filters as FiltersState['filters'])
        : defaults.filters,
    relationshipGoals: Array.isArray(data.relationshipGoals)
      ? data.relationshipGoals.filter((v): v is string => typeof v === 'string')
      : defaults.relationshipGoals,
    workFields: Array.isArray(data.workFields)
      ? data.workFields.filter(
          (v): v is string => typeof v === 'string' && WORK_SPHERE_VALUES.has(v),
        )
      : defaults.workFields,
    educationLevel: parsedEducation,
    educationInstitution:
      typeof data.educationInstitution === 'string'
        ? data.educationInstitution
        : defaults.educationInstitution,
    priorities: parsePriorities(data.priorities, defaults.priorities),
  }
}

function parseStoredPayload(raw: unknown): PersistedFeedFilters | null {
  if (raw == null || typeof raw !== 'object') return null

  const data = raw as Record<string, unknown>
  const nested = data.filters

  if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
    const nestedRecord = nested as Record<string, unknown>
    if (isPersistedFeedFiltersBlob(nestedRecord)) {
      return parsePersistedFilters(nestedRecord)
    }
  }

  return parsePersistedFilters(raw)
}

export function loadPersistedFeedFilters(): PersistedFeedFilters | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parseStoredPayload(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

/** Состояние ленты из localStorage (каждый запуск читаем заново). */
export function loadAppliedFiltersState(): FiltersState {
  const persisted = loadPersistedFeedFilters()
  if (!persisted) return getDefaultFiltersState()
  return { ...getDefaultFiltersState(), ...persisted }
}

export function savePersistedFeedFilters(state: FiltersState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(extractPersistedFeedFilters(state)))
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedFeedFilters(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
