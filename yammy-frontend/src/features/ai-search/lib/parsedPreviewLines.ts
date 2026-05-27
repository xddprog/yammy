import type { ParsedSearchPreview } from '@/entities/ai-search'
import { RELATIONSHIP_GOAL_OPTIONS } from '@/entities/user/constants/profileFieldOptions'

export function parsedPreviewLines(parsed: ParsedSearchPreview): string[] {
  const lines: string[] = []

  if (parsed.gender === 'female') lines.push('Женщины')
  if (parsed.gender === 'male') lines.push('Мужчины')

  if (parsed.ageMin != null && parsed.ageMax != null) {
    lines.push(`${parsed.ageMin}–${parsed.ageMax} лет`)
  }

  if (parsed.city?.trim()) {
    lines.push(parsed.city.trim())
  }

  if (parsed.relationshipGoal) {
    const label = RELATIONSHIP_GOAL_OPTIONS.find((o) => o.value === parsed.relationshipGoal)?.label
    if (label) lines.push(label)
  }

  return lines
}

export function parsedPreviewSummary(parsed: ParsedSearchPreview): string {
  const parts = parsedPreviewLines(parsed)
  if (parts.length === 0) return 'Фильтры не распознаны'
  return `Понял: ${parts.join(', ')}`
}
