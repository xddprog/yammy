import type { JSX } from 'react'

import type { FilterCategoryDto } from '@/entities/user/types/types'
import type { UserLanguage } from '@/entities/user/types/types'
import { filterCatalogLabel } from '@/entities/user/lib/filterLabelByLanguage'
import { cn } from '@/shared'

import type { OnboardingDraft } from '../lib/onboardingDraft'

type OnboardingTraitChipsProps = {
  categories: FilterCategoryDto[]
  draft: OnboardingDraft
  onChange: (next: OnboardingDraft) => void
  uiLang?: UserLanguage
}

export function OnboardingTraitChips({
  categories,
  draft,
  onChange,
  uiLang = 'ru',
}: OnboardingTraitChipsProps): JSX.Element {
  const toggle = (optionId: string): void => {
    const has = draft.filterOptionIds.includes(optionId)
    onChange({
      ...draft,
      filterOptionIds: has
        ? draft.filterOptionIds.filter((id) => id !== optionId)
        : [...draft.filterOptionIds, optionId],
    })
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.slug} className="rounded-[28px] py-1">
          <p className="mb-3 text-sm font-normal text-white">{filterCatalogLabel(category, uiLang)}</p>
          <div className="space-y-3">
            {category.subcategories.map((subcategory) => (
              <div key={`${category.slug}:${subcategory.slug}`}>
                <p className="mb-2 text-[13px] font-[160] text-muted-foreground">
                  {filterCatalogLabel(subcategory, uiLang)}
                </p>
                <div className="-mx-1 overflow-x-auto px-1 no-scrollbar">
                  <div className="inline-flex min-w-max gap-2 pr-1">
                    {subcategory.options.map((option) => {
                      const selected = draft.filterOptionIds.includes(option.id)
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggle(option.id)}
                          className={cn(
                            'shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-light transition-colors',
                            selected
                              ? 'border-transparent bg-card text-[#FF6BA4]'
                              : 'border-transparent bg-card text-foreground',
                          )}
                        >
                          {filterCatalogLabel(option, uiLang)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
