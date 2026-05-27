import type { ParsedSearchPreview } from '@/entities/ai-search'
import type { FiltersState } from '@/features/matches-filter/model/types'

export function mockParsedToFiltersState(
  parsed: ParsedSearchPreview,
  current: FiltersState,
): FiltersState {
  const next = { ...current }

  if (parsed.gender === 'male') {
    next.gender = 'Мужской'
  } else if (parsed.gender === 'female') {
    next.gender = 'Женский'
  }

  if (parsed.ageMin != null && parsed.ageMax != null) {
    next.ageRange = [parsed.ageMin, parsed.ageMax]
  }

  if (parsed.city?.trim()) {
    next.city = parsed.city.trim()
  }

  if (parsed.relationshipGoal) {
    next.relationshipGoals = [parsed.relationshipGoal]
  }

  return next
}
