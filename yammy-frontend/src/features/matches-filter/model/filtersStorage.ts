import { LocalStorageKeys } from '@/shared/lib/localStorageKeys'

import type { FiltersState } from './types'
import { getDefaultFiltersState } from './types'

const STORAGE_KEY = LocalStorageKeys.FILTERS

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function ensureArrayOfStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function ensureAgeRange(value: unknown): [number, number] {
  const def = getDefaultFiltersState().ageRange
  if (!Array.isArray(value) || value.length !== 2) return def
  const [a, b] = value
  if (typeof a !== 'number' || typeof b !== 'number') return def
  return [a, b]
}

function ensurePriorities(value: unknown): [number, number, number] {
  const def = getDefaultFiltersState().priorities
  if (!Array.isArray(value) || value.length !== 3) return def
  const [a, b, c] = value
  if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') return def
  return [a, b, c]
}

/** Читает и валидирует состояние фильтров из localStorage. При ошибке или невалидных данных возвращает дефолты. */
export function loadFilters(): FiltersState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return getDefaultFiltersState()

    const parsed = JSON.parse(raw) as unknown
    if (!isPlainObject(parsed)) return getDefaultFiltersState()

    const defaults = getDefaultFiltersState()

    const rawFilters = isPlainObject((parsed as Record<string, unknown>).filters)
      ? ((parsed as Record<string, unknown>).filters as Record<string, unknown>)
      : {}

    const filters: FiltersState['filters'] = Object.fromEntries(
      Object.entries(rawFilters).map(([categorySlug, subcategories]) => {
        if (!isPlainObject(subcategories)) {
          return [categorySlug, {}]
        }

        const normalizedSubcategories = Object.fromEntries(
          Object.entries(subcategories as Record<string, unknown>).map(
            ([subcategorySlug, values]) => [subcategorySlug, ensureArrayOfStrings(values)],
          ),
        )

        return [categorySlug, normalizedSubcategories]
      }),
    )

    return {
      gender:
        parsed.gender === 'Мужской' || parsed.gender === 'Женский'
          ? parsed.gender
          : defaults.gender,
      ageRange: ensureAgeRange((parsed as Record<string, unknown>).ageRange),
      city:
        typeof (parsed as Record<string, unknown>).city === 'string'
          ? ((parsed as Record<string, unknown>).city as string)
          : defaults.city,
      filters,
      relationshipGoals: ensureArrayOfStrings(
        (parsed as Record<string, unknown>).relationshipGoals,
      ) as FiltersState['relationshipGoals'],
      workFields: ensureArrayOfStrings(
        (parsed as Record<string, unknown>).workFields,
      ) as FiltersState['workFields'],
      job:
        typeof (parsed as Record<string, unknown>).job === 'string'
          ? ((parsed as Record<string, unknown>).job as string)
          : defaults.job,
      educationLevel:
        typeof (parsed as Record<string, unknown>).educationLevel === 'string'
          ? ((parsed as Record<string, unknown>).educationLevel as FiltersState['educationLevel'])
          : defaults.educationLevel,
      educationInstitution:
        typeof (parsed as Record<string, unknown>).educationInstitution === 'string'
          ? ((parsed as Record<string, unknown>).educationInstitution as string)
          : defaults.educationInstitution,
      priorities: ensurePriorities((parsed as Record<string, unknown>).priorities),
      premiumOnly:
        typeof (parsed as Record<string, unknown>).premiumOnly === 'boolean'
          ? ((parsed as Record<string, unknown>).premiumOnly as boolean)
          : defaults.premiumOnly,
    }
  } catch {
    return getDefaultFiltersState()
  }
}

/** Сохраняет состояние фильтров в localStorage. */
export function saveFilters(state: FiltersState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota or other storage errors
  }
}
