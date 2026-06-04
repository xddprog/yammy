import type { FilterCategoryDto, UserFilters } from '@/entities/user/types/types'
import { RELATIONSHIP_GOAL_OPTIONS, WORK_SPHERE_OPTIONS } from '@/entities/user/constants/profileFieldOptions'

import type { FiltersState } from '../model/types'

const RELATIONSHIP_GOAL_VALUES = new Set<string>(
  RELATIONSHIP_GOAL_OPTIONS.map((option) => option.value),
)
const WORK_SPHERE_VALUES = new Set<string>(WORK_SPHERE_OPTIONS.map((option) => option.value))

export function reconcileUserFiltersWithMetadata(
  filters: UserFilters,
  metadata: FilterCategoryDto[],
): UserFilters {
  const categoryBySlug = new Map(metadata.map((cat) => [cat.slug, cat]))
  const out: UserFilters = {}

  for (const [categorySlug, subcategories] of Object.entries(filters)) {
    const category = categoryBySlug.get(categorySlug)
    if (!category) continue

    const subBySlug = new Map(category.subcategories.map((sub) => [sub.slug, sub]))
    const cleanedSubcategories: Record<string, string[]> = {}

    for (const [subSlug, optionSlugs] of Object.entries(subcategories)) {
      const subcategory = subBySlug.get(subSlug)
      if (!subcategory) continue

      const validOptionSlugs = new Set(subcategory.options.map((opt) => opt.slug))
      const kept = optionSlugs.filter((slug) => validOptionSlugs.has(slug))
      if (kept.length > 0) {
        cleanedSubcategories[subSlug] = kept
      }
    }

    if (Object.keys(cleanedSubcategories).length > 0) {
      out[categorySlug] = cleanedSubcategories
    }
  }

  return out
}

export function reconcileFiltersStateWithMetadata(
  state: FiltersState,
  metadata: FilterCategoryDto[],
): FiltersState {
  return {
    ...state,
    filters: reconcileUserFiltersWithMetadata(state.filters, metadata),
    relationshipGoals: state.relationshipGoals.filter((value) => RELATIONSHIP_GOAL_VALUES.has(value)),
    workFields: state.workFields.filter((value) => WORK_SPHERE_VALUES.has(value)),
  }
}
