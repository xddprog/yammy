import { AGE_DEFAULT_MAX, AGE_DEFAULT_MIN } from '../lib/constants'
import type { EducationLevel } from '../model/educationLevel'
import type { FiltersState } from '../model/types'
import { getDefaultFiltersState } from '../model/types'

const STORAGE_KEY = 'yammy_feed_filters_v1'

/** Поля ленты поиска (без bio/job — они из профиля в API). */
export type PersistedFeedFilters = Pick<
  FiltersState,
  | 'gender'
  | 'ageRange'
  | 'city'
  | 'filters'
  | 'relationshipGoals'
  | 'workFields'
  | 'educationLevel'
  | 'educationInstitution'
  | 'priorities'
  | 'premiumOnly'
>

export function extractPersistedFeedFilters(state: FiltersState): PersistedFeedFilters {
  return {
    gender: state.gender,
    ageRange: state.ageRange,
    city: state.city,
    filters: state.filters,
    relationshipGoals: state.relationshipGoals,
    workFields: state.workFields,
    educationLevel: state.educationLevel,
    educationInstitution: state.educationInstitution,
    priorities: state.priorities,
    premiumOnly: state.premiumOnly,
  }
}

function isEducationLevel(value: unknown): value is EducationLevel {
  return value === 'school' || value === 'college' || value === 'higher'
}

function parsePersisted(raw: unknown): PersistedFeedFilters | null {
  if (raw == null || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  const defaults = getDefaultFiltersState()

  const ageRange = data.ageRange
  if (
    !Array.isArray(ageRange) ||
    ageRange.length !== 2 ||
    typeof ageRange[0] !== 'number' ||
    typeof ageRange[1] !== 'number'
  ) {
    return null
  }

  const priorities = data.priorities
  if (
    !Array.isArray(priorities) ||
    priorities.length !== 3 ||
    priorities.some((n) => typeof n !== 'number')
  ) {
    return null
  }

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
    ageRange: [
      Math.max(AGE_DEFAULT_MIN, Math.min(ageRange[0], AGE_DEFAULT_MAX)),
      Math.max(AGE_DEFAULT_MIN, Math.min(ageRange[1], AGE_DEFAULT_MAX)),
    ] as [number, number],
    city: typeof data.city === 'string' ? data.city : '',
    filters:
      data.filters != null && typeof data.filters === 'object' && !Array.isArray(data.filters)
        ? (data.filters as FiltersState['filters'])
        : {},
    relationshipGoals: Array.isArray(data.relationshipGoals)
      ? data.relationshipGoals.filter((v): v is string => typeof v === 'string')
      : [],
    workFields: Array.isArray(data.workFields)
      ? data.workFields.filter((v): v is string => typeof v === 'string')
      : [],
    educationLevel: parsedEducation,
    educationInstitution:
      typeof data.educationInstitution === 'string' ? data.educationInstitution : '',
    priorities: priorities as [number, number, number],
    premiumOnly: Boolean(data.premiumOnly),
  }
}

export function loadPersistedFeedFilters(): PersistedFeedFilters | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parsePersisted(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
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

export function getInitialFiltersState(): FiltersState {
  const persisted = loadPersistedFeedFilters()
  if (!persisted) return getDefaultFiltersState()
  return { ...getDefaultFiltersState(), ...persisted }
}
