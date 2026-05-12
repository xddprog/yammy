import type React from 'react'

import { useFiltersMetadata } from '@/entities/user/hooks/useFiltersMetadata'
import type { FiltersState } from '@/features/matches-filter/model/types'
import { cn } from '@/shared'

import type { ProfilePhotoItem, UserFilters } from '@/entities/user/types/types'
import {
  EDUCATION_LEVEL_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
  WORK_SPHERE_OPTIONS,
} from './profile.constants'
import { ProfileEditSheetRow } from './profileEditSheetRow'
import { ProfilePhotosEditor } from './profilePhotosEditor'

interface ProfileEditFormProps {
  draft: FiltersState
  setDraft: React.Dispatch<React.SetStateAction<FiltersState>>
  photos: ProfilePhotoItem[]
  setPhotos: React.Dispatch<React.SetStateAction<ProfilePhotoItem[]>>
}

export const ProfileEditForm = ({
  draft,
  setDraft,
  photos,
  setPhotos,
}: ProfileEditFormProps): React.JSX.Element => {
  const educationLevelLabel =
    EDUCATION_LEVEL_OPTIONS.find((option) => option.value === draft.educationLevel)?.label ?? ''
  const isHigherEducation = educationLevelLabel === 'Высшее'
  const workFieldLabel =
    WORK_SPHERE_OPTIONS.find((option) => option.value === draft.workFields[0])?.label ?? ''
  const relationshipGoalLabel =
    RELATIONSHIP_GOAL_OPTIONS.find((option) => option.value === draft.relationshipGoals[0])?.label ?? ''
  const userAge = Math.round((draft.ageRange[0] + draft.ageRange[1]) / 2)
  const { data: filtersMetadata } = useFiltersMetadata()

  return (
    <section className="flex flex-col gap-3">
      <ProfilePhotosEditor photos={photos} setPhotos={setPhotos} />

      <div className="mb-4 flex flex-col gap-1.5">
        <ProfileEditSheetRow
          mode="age"
          label="Возраст"
          value={String(userAge)}
          onApplyAge={(age) => setDraft((prev) => ({ ...prev, ageRange: [age, age] }))}
          placeholder="Не указано"
          ariaLabel="Возраст"
        />

        <ProfileEditSheetRow
          mode="pick"
          label="Пол"
          displayValue={draft.gender ?? ''}
          options={['Мужской', 'Женский']}
          onPick={(label) =>
            setDraft((prev) => ({
              ...prev,
              gender: label ? (label as 'Мужской' | 'Женский') : null,
            }))
          }
          placeholder="Не указано"
          ariaLabel="Пол"
        />

        <ProfileEditSheetRow
          mode="pick"
          label="Цель отношений"
          displayValue={relationshipGoalLabel}
          options={RELATIONSHIP_GOAL_OPTIONS.map((option) => option.label)}
          onPick={(label) => {
            const selected = RELATIONSHIP_GOAL_OPTIONS.find((option) => option.label === label)
            setDraft((prev) => ({
              ...prev,
              relationshipGoals: selected ? [selected.value] : [],
            }))
          }}
          placeholder="Не указано"
          ariaLabel="Цель отношений"
        />

        <ProfileEditSheetRow
          mode="city"
          label="Город"
          value={draft.city}
          onApply={(value) => setDraft((prev) => ({ ...prev, city: value }))}
          placeholder="Не указано"
          ariaLabel="Город"
        />

        <ProfileEditSheetRow
          mode="pick"
          label="Сфера работы"
          displayValue={workFieldLabel}
          options={WORK_SPHERE_OPTIONS.map((option) => option.label)}
          onPick={(label) => {
            const selected = WORK_SPHERE_OPTIONS.find((option) => option.label === label)
            const nextFields = selected ? [selected.value] : label ? [label] : []
            setDraft((prev) => ({
              ...prev,
              workFields: nextFields,
              job: nextFields.length === 0 ? '' : prev.job,
            }))
          }}
          placeholder="Не указано"
          ariaLabel="Сфера работы"
        />

        <ProfileEditSheetRow
          mode="text"
          label="Должность"
          value={draft.job}
          onApply={(value) => setDraft((prev) => ({ ...prev, job: value }))}
          textPlaceholder="Например, менеджер проектов"
          placeholder="Не указано"
          ariaLabel="Должность"
        />

        <ProfileEditSheetRow
          mode="pick"
          label="Образование"
          displayValue={educationLevelLabel}
          options={EDUCATION_LEVEL_OPTIONS.map((option) => option.label)}
          onPick={(label) => {
            const selected = EDUCATION_LEVEL_OPTIONS.find((option) => option.label === label)
            setDraft((prev) => ({
              ...prev,
              educationLevel: selected?.value ?? (label ? prev.educationLevel : null),
              educationInstitution: selected?.value === 'higher' ? prev.educationInstitution : '',
            }))
          }}
          placeholder="Не указано"
          ariaLabel="Образование"
        />

        {isHigherEducation && (
          <ProfileEditSheetRow
            mode="university"
            label="ВУЗ"
            value={draft.educationInstitution}
            suggestEnabled={isHigherEducation}
            onApply={(value) => setDraft((prev) => ({ ...prev, educationInstitution: value }))}
            placeholder="Не указано"
            ariaLabel="Учебное заведение"
          />
        )}
      </div>

      {filtersMetadata?.map((category) => (
        <div key={category.slug} className="rounded-[28px] py-3.5">
          <p className="mb-3 text-sm font-normal text-white">{category.name}</p>
          <div className="space-y-3">
            {category.subcategories.map((subcategory) => {
              const subMap = draft.filters[category.slug]
              const tokens = subMap?.[subcategory.slug] ?? []
              return (
                <div key={`${category.slug}:${subcategory.slug}`}>
                  <p className="mb-2 text-[13px] font-[160] text-muted-foreground">
                    {subcategory.name}
                  </p>
                  <div className="-mx-1 w-auto min-w-0 max-w-none overflow-x-auto overflow-y-hidden px-1 no-scrollbar">
                    <div className="inline-flex min-w-max gap-2 pr-1">
                      {subcategory.options.map((option) => {
                        const selected = tokens.includes(option.slug)
                        return (
                          <button
                            key={option.slug}
                            type="button"
                            onClick={() => {
                              setDraft((prev) => {
                                const prevCat = prev.filters[category.slug] ?? {}
                                const currentSlugs = prevCat[subcategory.slug] ?? []
                                const wasSelected = currentSlugs.includes(option.slug)
                                const nextSlugs = wasSelected
                                  ? currentSlugs.filter((s) => s !== option.slug)
                                  : [...currentSlugs, option.slug]
                                const nextCat: Record<string, string[]> = { ...prevCat, [subcategory.slug]: nextSlugs }
                                const nextFilters: UserFilters = {
                                  ...prev.filters,
                                  [category.slug]: nextCat,
                                }
                                return { ...prev, filters: nextFilters }
                              })
                            }}
                            className={cn(
                              'shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-light transition-colors touch-manipulation cursor-pointer select-none border',
                              selected
                                ? 'bg-[#FF6BA4]/20 text-foreground border-[#FF6BA4]/40'
                                : 'bg-card text-foreground border-transparent hover:bg-background/60',
                            )}
                          >
                            {option.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}
