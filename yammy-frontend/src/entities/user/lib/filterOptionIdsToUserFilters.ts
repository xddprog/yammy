import type { FilterCategoryDto, UserFilters } from '../types/types'

/** Сопоставление id из поиска/ES с id в справочнике (регистр, пробелы). */
export function normalizeFilterOptionId(id: string): string {
  return id.trim().toLowerCase()
}

export function filterOptionIdsToUserFilters(
  ids: string[],
  metadata: FilterCategoryDto[] | undefined,
): UserFilters {
  if (!metadata?.length || !ids.length) {
    return {}
  }
  const idSet = new Set(ids.map(normalizeFilterOptionId).filter(Boolean))
  const out: UserFilters = {}
  for (const cat of metadata) {
    for (const sub of cat.subcategories) {
      const slugs: string[] = []
      for (const opt of sub.options) {
        if (idSet.has(normalizeFilterOptionId(String(opt.id)))) {
          slugs.push(opt.slug)
        }
      }
      if (slugs.length > 0) {
        if (!out[cat.slug]) {
          out[cat.slug] = {}
        }
        out[cat.slug][sub.slug] = slugs
      }
    }
  }
  return out
}
