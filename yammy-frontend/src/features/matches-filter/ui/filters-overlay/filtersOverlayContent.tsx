import type { PanInfo } from 'framer-motion'
import { animate, motion, useDragControls, useMotionValue } from 'framer-motion'
import isEqual from 'lodash/isEqual'
import { ListFilter, X } from 'lucide-react'
import { memo, useCallback } from 'react'

import { useFiltersMetadata } from '@/entities/user/hooks/useFiltersMetadata'
import { DragIndicator, SheetCard } from '@/features/matches-feed/ui/sheet-card'
import { Button } from '@/shared'

import { GENDER_OPTIONS } from '../../lib/constants'
import { useFiltersState } from '../../model/useFiltersState'
import { AgeRangeSlider } from './AgeRangeSlider'
import { CityInput } from './CityInput'
import { EducationInstitutionInput } from './EducationInstitutionInput'
import { FilterChipGroup } from './FilterChipGroup'
import { FilterRadioGroup } from './FilterRadioGroup'
import { FilterSection } from './FilterSection'
import { PremiumToggle } from './PremiumToggle'
import { PrioritySliders } from './PrioritySliders'

const DRAG_CLOSE_THRESHOLD = 120
const DRAG_VELOCITY_THRESHOLD = 400

const EDUCATION_LEVEL_OPTIONS = ['Школьное', 'Среднее специальное', 'Высшее'] as const
const HIGHER_EDUCATION_LEVEL_LABEL = 'Высшее' as const

const EDUCATION_LEVEL_TO_API: Record<(typeof EDUCATION_LEVEL_OPTIONS)[number], string> = {
  Школьное: 'school',
  'Среднее специальное': 'secondary_special',
  Высшее: 'higher',
}

const getEducationLabelFromState = (value: string | null): string | null => {
  if (!value) return null
  if (EDUCATION_LEVEL_OPTIONS.includes(value as (typeof EDUCATION_LEVEL_OPTIONS)[number])) {
    return value
  }

  const entry = (Object.entries(EDUCATION_LEVEL_TO_API) as [string, string][]).find(
    ([, code]) => code === value,
  )

  return entry?.[0] ?? null
}

export interface FiltersOverlayContentProps {
  onClose: () => void
}

const FiltersOverlayContent = ({ onClose }: FiltersOverlayContentProps): React.JSX.Element => {
  const dragY = useMotionValue(0)
  const dragControls = useDragControls()
  const filters = useFiltersState()
  const { data: filtersMetadata } = useFiltersMetadata()

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
    <div className="h-full p-4 flex flex-col min-h-0">
      <motion.div
        className="flex flex-1 min-h-0 w-full flex-col"
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
          className="flex min-h-0 flex-1 flex-col"
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
                onClick={() => filters.reset()}
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
          contentClassName="px-6 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="mb-5 flex flex-col items-start gap-3 shrink-0">
            <div className="w-full flex items-center justify-between">
              <h2 className="text-[32px] font-bold leading-tight tracking-tight text-black">
                Фильтры
              </h2>
              <ListFilter className="text-[#FF6BA4] size-6" aria-hidden />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pb-4 -mx-1 px-1">
            <div className="flex flex-col gap-6">
              <FilterSection label="Пол">
                <FilterRadioGroup
                  options={GENDER_OPTIONS}
                  value={filters.state.gender}
                  onChange={filters.setGender}
                  aria-label="Пол"
                />
              </FilterSection>
              <FilterSection label="Возраст">
                <AgeRangeSlider
                  value={filters.state.ageRange}
                  onValueChange={filters.setAgeRange}
                />
              </FilterSection>
              <FilterSection label="Город">
                <CityInput value={filters.state.city} onChange={filters.setCity} />
              </FilterSection>

              <FilterSection label="Образование">
                <FilterChipGroup
                  options={EDUCATION_LEVEL_OPTIONS}
                  value={
                    getEducationLabelFromState(filters.state.educationLevel)
                      ? [getEducationLabelFromState(filters.state.educationLevel)!]
                      : []
                  }
                  onChange={(v) => {
                    const label = v[0]
                    if (!label) {
                      filters.setEducationLevel(null)
                      return
                    }
                    const code =
                      EDUCATION_LEVEL_TO_API[label as (typeof EDUCATION_LEVEL_OPTIONS)[number]] ??
                      label
                    filters.setEducationLevel(code)
                  }}
                  multiple={false}
                  aria-label="Уровень образования"
                />
                {getEducationLabelFromState(filters.state.educationLevel) ===
                  HIGHER_EDUCATION_LEVEL_LABEL && (
                  <div className="mt-2">
                    <EducationInstitutionInput
                      value={filters.state.educationInstitution}
                      onChange={filters.setEducationInstitution}
                    />
                  </div>
                )}
              </FilterSection>

              {filtersMetadata &&
                filtersMetadata.map((category) =>
                  category.subcategories.map((subcategory) => {
                    const optionNames = subcategory.options.map((option) => option.name)
                    const selectedSlugs =
                      filters.state.filters[category.slug]?.[subcategory.slug] ?? []

                    const selectedNames = subcategory.options
                      .filter((option) => selectedSlugs.includes(option.slug))
                      .map((option) => option.name)

                    return (
                      <FilterSection
                        key={`${category.slug}:${subcategory.slug}`}
                        label={subcategory.name}
                      >
                        <FilterChipGroup
                          options={optionNames as readonly string[]}
                          value={selectedNames}
                          onChange={(nextNames) => {
                            const nextSlugs = subcategory.options
                              .filter((option) => nextNames.includes(option.name))
                              .map((option) => option.slug)

                            filters.setFilterValue(category.slug, subcategory.slug, nextSlugs)
                          }}
                          multiple
                          aria-label={subcategory.name}
                        />
                      </FilterSection>
                    )
                  }),
                )}

              <FilterSection label="Приоритеты (Веса)">
                <PrioritySliders
                  value={filters.state.priorities}
                  onValueChange={filters.setPriorities}
                />
              </FilterSection>
              <FilterSection label="Показывать в ленте">
                <PremiumToggle
                  checked={filters.state.premiumOnly}
                  onCheckedChange={filters.setPremiumOnly}
                />
              </FilterSection>
            </div>
          </div>
        </SheetCard>
      </motion.div>
    </div>
  )
}

export const FiltersOverlayContentMemo = memo(FiltersOverlayContent)
