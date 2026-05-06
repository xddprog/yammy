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
import { FilterChipGroup } from './FilterChipGroup'
import { FilterComboboxField } from './FilterComboboxField'
import { FilterRadioGroup } from './FilterRadioGroup'
import { FilterSection } from './FilterSection'
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

const RELATIONSHIP_GOAL_OPTIONS = [
  { label: 'Серьезные отношения', value: 'serious' },
  { label: 'Знакомства', value: 'dating' },
  { label: 'Дружба', value: 'friendship' },
] as const

const CITY_MOCK_OPTIONS = [
  'Москва',
  'Санкт-Петербург',
  'Казань',
  'Екатеринбург',
  'Новосибирск',
  'Нижний Новгород',
  'Краснодар',
  'Ростов-на-Дону',
  'Самара',
  'Воронеж',
] as const

const WORK_SPHERE_MOCK_OPTIONS = [
  { label: 'IT', value: 'it' },
  { label: 'Дизайн', value: 'design' },
  { label: 'Маркетинг', value: 'marketing' },
  { label: 'Финансы', value: 'finance' },
  { label: 'Образование', value: 'education' },
] as const

const EDUCATION_INSTITUTION_MOCK_OPTIONS = [
  'МГУ',
  'МГТУ им. Н.Э. Баумана',
  'ВШЭ',
  'СПбГУ',
  'МФТИ',
  'ИТМО',
  'МГИМО',
  'РАНХиГС',
  'КФУ',
  'УрФУ',
] as const

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
    <div className="h-full w-full px-4 pb-4 pt-[50px] flex flex-col min-h-0 min-w-0">
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
                  options={CITY_MOCK_OPTIONS}
                  placeholder="Город"
                  ariaLabel="Город"
                />
              </FilterSection>

              <FilterSection label="Сфера работы">
                <FilterComboboxField
                  value={
                    WORK_SPHERE_MOCK_OPTIONS.find((option) =>
                      filters.state.workFields.includes(option.value),
                    )?.label ?? ''
                  }
                  onChange={(value) => {
                    const selected = WORK_SPHERE_MOCK_OPTIONS.find(
                      (option) => option.label === value,
                    )
                    filters.setWorkFields(selected ? [selected.value] : value ? [value] : [])
                  }}
                  options={WORK_SPHERE_MOCK_OPTIONS.map((option) => option.label)}
                  placeholder="Сфера работы"
                  ariaLabel="Сфера работы"
                />
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
                    <FilterComboboxField
                      value={filters.state.educationInstitution}
                      onChange={filters.setEducationInstitution}
                      options={EDUCATION_INSTITUTION_MOCK_OPTIONS}
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
                  <FilterSection key={category.slug} label={category.name}>
                    <div className="flex w-full min-w-0 flex-col gap-4">
                      {category.subcategories.map((subcategory) => {
                        const optionNames = subcategory.options.map((option) => option.name)
                        const selectedSlugs =
                          filters.state.filters[category.slug]?.[subcategory.slug] ?? []

                        const selectedNames = subcategory.options
                          .filter((option) => selectedSlugs.includes(option.slug))
                          .map((option) => option.name)

                        return (
                          <div
                            key={`${category.slug}:${subcategory.slug}`}
                            className="w-full min-w-0 space-y-2"
                          >
                            <p className="font-[160] text-[13px] text-neutral-500">
                              {subcategory.name}
                            </p>
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
