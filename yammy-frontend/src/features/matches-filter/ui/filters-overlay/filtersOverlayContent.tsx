import type { PanInfo } from 'framer-motion'
import { animate, motion, useDragControls, useMotionValue } from 'framer-motion'
import isEqual from 'lodash/isEqual'
import { ListFilter, X } from 'lucide-react'
import { memo, useCallback, useEffect } from 'react'

import {
  RELATIONSHIP_GOAL_OPTIONS,
  WORK_SPHERE_OPTIONS,
} from '@/entities/user/constants/profileFieldOptions'
import { useFiltersMetadata } from '@/entities/user/hooks/useFiltersMetadata'
import { useUserProfile } from '@/entities/user/hooks/useUserProfile'
import { filterCatalogLabel } from '@/entities/user/lib/filterLabelByLanguage'
import { DragIndicator, SheetCard } from '@/features/matches-feed/ui/sheet-card'
import { Button } from '@/shared'
import { useCityNames } from '@/shared/hooks/useCityNames'
import { useUniversityNames } from '@/shared/hooks/useUniversityNames'

import { GENDER_OPTIONS } from '../../lib/constants'
import type { EducationLevel } from '../../model/educationLevel'
import { useFiltersState } from '../../model/useFiltersState'
import { FilterChipGroup } from './FilterChipGroup'
import { FilterComboboxField } from './FilterComboboxField'
import { AgeRangeSlider } from './AgeRangeSlider'
import { FilterRadioGroup } from './FilterRadioGroup'
import { FilterSearchTextField } from './FilterSearchTextField'
import { FilterSection } from './FilterSection'
import { PrioritySliders } from './PrioritySliders'

const DRAG_CLOSE_THRESHOLD = 120
const DRAG_VELOCITY_THRESHOLD = 400

const EDUCATION_OPTIONS: { label: string; value: EducationLevel }[] = [
  { label: 'Школьное', value: 'school' },
  { label: 'Среднее специальное', value: 'college' },
  { label: 'Высшее', value: 'higher' },
]

export interface FiltersOverlayContentProps {
  onClose: () => void
}

const FiltersOverlayContent = ({ onClose }: FiltersOverlayContentProps): React.JSX.Element => {
  const dragY = useMotionValue(0)
  const dragControls = useDragControls()
  const filters = useFiltersState()
  const { data: filtersMetadata } = useFiltersMetadata()
  const { data: profile } = useUserProfile()
  const uiLang = profile?.language
  const { data: cityNames = [] } = useCityNames(filters.state.city)
  const showUniversityField = filters.state.educationLevel === 'higher'
  const { data: universityNames = [] } = useUniversityNames(filters.state.educationInstitution, {
    enabled: showUniversityField,
  })

  useEffect(() => {
    filters.setState(filters.appliedState)
  }, [])

  const handleCancel = useCallback(() => {
    filters.setState(filters.appliedState)
    onClose()
  }, [filters, onClose])

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const shouldClose =
        info.offset.y > DRAG_CLOSE_THRESHOLD || info.velocity.y > DRAG_VELOCITY_THRESHOLD
      if (shouldClose) {
        handleCancel()
      } else {
        animate(dragY, 0, { type: 'spring', stiffness: 350, damping: 35 })
      }
    },
    [dragY, handleCancel],
  )

  const handleIndicatorClick = useCallback(() => {
    animate(dragY, 0, { type: 'spring', stiffness: 300, damping: 30 })
  }, [dragY])

  const handleApply = useCallback(() => {
    filters.persist()
    onClose()
  }, [filters, onClose])

  const isApplyDisabled = isEqual(filters.state, filters.appliedState)

  return (
    <div className="h-full w-full px-4 pb-4 pt-[85px] flex flex-col min-h-0 min-w-0">
      <motion.div
        className="flex flex-1 min-h-0 min-w-0 w-full flex-col"
        style={{ y: dragY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 400 }}
        dragControls={dragControls}
        dragElastic={0.15}
        dragListener={false}
        onDragEnd={handleDragEnd}
      >
        <SheetCard
          className="flex min-h-0 min-w-0 w-full flex-1 flex-col"
          indicator={
            <DragIndicator
              onPointerDown={(e) => dragControls.start(e)}
              onClick={handleIndicatorClick}
            />
          }
          footer={
            <div className="w-full flex gap-2 items-center px-6 pb-5">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label="Закрыть"
                onClick={handleCancel}
                className="text-neutral-800"
              >
                <X className="size-5" />
              </Button>
              <div className="w-full">
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={handleApply}
                  disabled={isApplyDisabled}
                >
                  Применить
                </Button>
              </div>
            </div>
          }
          contentClassName="px-6 flex flex-col min-h-0 min-w-0 overflow-hidden"
        >
          <div className="mb-5 flex flex-col items-start gap-3 shrink-0">
            <div className="w-full flex items-center justify-between">
              <h2 className="text-[32px] font-bold leading-tight tracking-tight text-black">
                Фильтры
              </h2>
              <ListFilter className="text-[#FF6BA4] size-6" aria-hidden />
            </div>
          </div>

          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pb-4 -mx-1 px-1">
            <div className="flex w-full min-w-0 flex-col gap-6">
              <FilterSection label="Пол">
                <FilterRadioGroup
                  options={GENDER_OPTIONS}
                  value={filters.state.gender}
                  onChange={filters.setGender}
                  aria-label="Пол"
                />
              </FilterSection>

              <FilterSection label="Возраст">
                <AgeRangeSlider value={filters.state.ageRange} onValueChange={filters.setAgeRange} />
              </FilterSection>

              <FilterSection label="Цель отношений">
                <FilterChipGroup
                  options={RELATIONSHIP_GOAL_OPTIONS.map((option) => option.label)}
                  value={RELATIONSHIP_GOAL_OPTIONS.filter((option) =>
                    filters.state.relationshipGoals.includes(option.value),
                  ).map((option) => option.label)}
                  onChange={(nextLabels) => {
                    const nextValues = RELATIONSHIP_GOAL_OPTIONS.filter((option) =>
                      nextLabels.includes(option.label),
                    ).map((option) => option.value)
                    filters.setRelationshipGoals(nextValues.slice(0, 1))
                  }}
                  multiple={false}
                  aria-label="Цель отношений"
                />
              </FilterSection>

              <FilterSection label="Город">
                <FilterComboboxField
                  value={filters.state.city}
                  onChange={filters.setCity}
                  options={cityNames}
                  placeholder="Город"
                  ariaLabel="Город"
                />
              </FilterSection>

              <FilterSection label="Сфера работы">
                <FilterComboboxField
                  selectOnly
                  value={
                    WORK_SPHERE_OPTIONS.find((option) =>
                      filters.state.workFields.includes(option.value),
                    )?.label ?? ''
                  }
                  onChange={(value) => {
                    if (!value) {
                      filters.setWorkFields([])
                      return
                    }
                    const selected = WORK_SPHERE_OPTIONS.find((option) => option.label === value)
                    if (selected) {
                      filters.setWorkFields([selected.value])
                    }
                  }}
                  options={WORK_SPHERE_OPTIONS.map((option) => option.label)}
                  placeholder="Сфера работы"
                  ariaLabel="Сфера работы"
                />
              </FilterSection>

              <FilterSection label="Поиск по описанию">
                <FilterSearchTextField
                  value={filters.state.searchText}
                  onChange={filters.setSearchText}
                  placeholder="Например: любит путешествия"
                  ariaLabel="Семантический поиск по описанию анкеты"
                />
              </FilterSection>

              <FilterSection label="Образование">
                <FilterChipGroup
                  options={EDUCATION_OPTIONS.map((o) => o.label)}
                  value={EDUCATION_OPTIONS.filter((o) => o.value === filters.state.educationLevel).map(
                    (o) => o.label,
                  )}
                  onChange={(v) => {
                    const label = v[0]
                    if (!label) {
                      filters.setEducationLevel(null)
                      filters.setEducationInstitution('')
                      return
                    }
                    const row = EDUCATION_OPTIONS.find((o) => o.label === label)
                    filters.setEducationLevel(row?.value ?? null)
                    if (row?.value !== 'higher') {
                      filters.setEducationInstitution('')
                    }
                  }}
                  multiple={false}
                  aria-label="Уровень образования"
                />
                {showUniversityField && (
                  <div className="mt-2">
                    <FilterComboboxField
                      value={filters.state.educationInstitution}
                      onChange={filters.setEducationInstitution}
                      options={universityNames}
                      placeholder="Учебное заведение"
                      ariaLabel="Учебное заведение"
                    />
                  </div>
                )}
              </FilterSection>

              <FilterSection label="Приоритеты (Веса)">
                <PrioritySliders
                  value={filters.state.priorities}
                  onValueChange={filters.setPriorities}
                />
              </FilterSection>

              {filtersMetadata &&
                filtersMetadata.map((category) => (
                  <FilterSection key={category.slug} label={filterCatalogLabel(category, uiLang)}>
                    <div className="flex w-full min-w-0 flex-col gap-4">
                      {category.subcategories.map((subcategory) => {
                        const selectedSlugs =
                          filters.state.filters[category.slug]?.[subcategory.slug] ?? []

                        const optionDisplayLabels = subcategory.options.map((o) => filterCatalogLabel(o, uiLang))
                        const selectedDisplay = subcategory.options
                          .filter((option) => selectedSlugs.includes(option.slug))
                          .map((option) => filterCatalogLabel(option, uiLang))

                        return (
                          <div
                            key={`${category.slug}:${subcategory.slug}`}
                            className="w-full min-w-0 space-y-2"
                          >
                            <p className="font-[160] text-[13px] text-neutral-500">
                              {filterCatalogLabel(subcategory, uiLang)}
                            </p>
                            <FilterChipGroup
                              options={optionDisplayLabels as readonly string[]}
                              value={selectedDisplay}
                              onChange={(nextDisplay) => {
                                const nextSlugs = subcategory.options
                                  .filter((option) => nextDisplay.includes(filterCatalogLabel(option, uiLang)))
                                  .map((option) => option.slug)

                                filters.setFilterValue(category.slug, subcategory.slug, nextSlugs)
                              }}
                              multiple
                              aria-label={filterCatalogLabel(subcategory, uiLang)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </FilterSection>
                ))}
            </div>
          </div>
        </SheetCard>
      </motion.div>
    </div>
  )
}

export const FiltersOverlayContentMemo = memo(FiltersOverlayContent)
