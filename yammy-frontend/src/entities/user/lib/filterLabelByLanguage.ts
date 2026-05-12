import type { FilterCategoryDto, UserFilters } from '../types/types'

/** RU — человекочитаемые подписи из API (`name`); иначе стабильные `slug` для EN и др. */
export function isRussianUiLanguage(language: string | undefined | null): boolean {
  return language == null || language === '' || language === 'ru'
}

export function filterCatalogLabel(
  entity: { slug: string; name: string },
  language: string | undefined | null,
): string {
  return isRussianUiLanguage(language) ? entity.name : entity.slug
}

export type TraitDisplaySection = {
  categoryTitle: string
  rows: { subTitle: string; valuesLine: string }[]
}

/** Секции характеристик для карточки/оверлея: порядок как в справочнике. */
export function userFiltersToTraitDisplaySections(
  userFilters: UserFilters | undefined,
  metadata: FilterCategoryDto[] | undefined,
  language: string | undefined | null,
): TraitDisplaySection[] {
  if (!metadata?.length) {
    return []
  }
  if (userFilters == null || Object.keys(userFilters).length === 0) {
    return []
  }
  const sections: TraitDisplaySection[] = []
  for (const cat of metadata) {
    const subMap = userFilters[cat.slug]
    if (!subMap) {
      continue
    }
    const rows: TraitDisplaySection['rows'] = []
    for (const sub of cat.subcategories) {
      const slugs = subMap[sub.slug]
      if (!slugs?.length) {
        continue
      }
      const valuesLine = slugs
        .map((slug) => {
          const opt = sub.options.find((o) => o.slug === slug)
          return opt ? filterCatalogLabel(opt, language) : slug
        })
        .join(', ')
      rows.push({
        subTitle: filterCatalogLabel(sub, language),
        valuesLine,
      })
    }
    if (rows.length > 0) {
      sections.push({
        categoryTitle: filterCatalogLabel(cat, language),
        rows,
      })
    }
  }
  return sections
}
