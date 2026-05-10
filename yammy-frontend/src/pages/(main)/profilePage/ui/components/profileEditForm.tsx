import type React from 'react'

import { useFiltersMetadata } from '@/entities/user/hooks/useFiltersMetadata'
import type { FiltersState } from '@/features/matches-filter/model/types'
import { cn } from '@/shared'
import { useCityNames } from '@/shared/hooks/useCityNames'
import { useUniversityNames } from '@/shared/hooks/useUniversityNames'

import type { ProfilePhotoItem } from '@/entities/user/types/types'
import { EDUCATION_LEVEL_OPTIONS, RELATIONSHIP_GOAL_OPTIONS, WORK_SPHERE_MOCK_OPTIONS } from './profile.constants'
import { ProfileAutocompleteRow } from './profileAutocompleteRow'
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
    EDUCATION_LEVEL_OPTIONS.find(
      (option) => option.value === draft.educationLevel || option.label === draft.educationLevel,
    )?.label ?? ''
  const isHigherEducation = educationLevelLabel === 'Высшее'
  const workFieldLabel =
    WORK_SPHERE_MOCK_OPTIONS.find((option) => option.value === draft.workFields[0])?.label ?? ''
  const relationshipGoalLabel =
    RELATIONSHIP_GOAL_OPTIONS.find((option) => option.value === draft.relationshipGoals[0])?.label ?? ''
  const userAge = Math.round((draft.ageRange[0] + draft.ageRange[1]) / 2)
  const { data: filtersMetadata } = useFiltersMetadata()
  const { data: cityNames = [] } = useCityNames(draft.city)
  const { data: universityNames = [] } = useUniversityNames(draft.educationInstitution, {
    enabled: isHigherEducation,
  })

  return (
    <section className="flex flex-col gap-3">
      <ProfilePhotosEditor photos={photos} setPhotos={setPhotos} />

      <div className="mb-4 flex flex-col gap-1.5">
        <ProfileAutocompleteRow
          label="Возраст"
          value={String(userAge)}
          onChange={(value) => {
            const age = Number(value)
            if (!Number.isFinite(age) || age < 18 || age > 100) return
            setDraft((prev) => ({ ...prev, ageRange: [age, age] }))
          }}
          options={Array.from({ length: 83 }, (_, index) => String(index + 18))}
          placeholder="Не указано"
          ariaLabel="Возраст"
        />

        <ProfileAutocompleteRow
          label="Пол"
          value={draft.gender ?? ''}
          onChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              gender: value ? (value as 'Мужской' | 'Женский') : null,
            }))
          }
          options={['Мужской', 'Женский']}
          placeholder="Не указано"
          ariaLabel="Пол"
        />

        <ProfileAutocompleteRow
          label="Цель отношений"
          value={relationshipGoalLabel}
          onChange={(label) => {
            const selected = RELATIONSHIP_GOAL_OPTIONS.find((option) => option.label === label)
            setDraft((prev) => ({
              ...prev,
              relationshipGoals: selected ? [selected.value] : [],
            }))
          }}
          options={RELATIONSHIP_GOAL_OPTIONS.map((option) => option.label)}
          placeholder="Не указано"
          ariaLabel="Цель отношений"
        />

        <ProfileAutocompleteRow
          label="Город"
          value={draft.city}
          onChange={(value) => setDraft((prev) => ({ ...prev, city: value }))}
          options={cityNames}
          placeholder="Не указано"
          ariaLabel="Город"
        />

        <ProfileAutocompleteRow
          label="Сфера работы"
          value={workFieldLabel}
          onChange={(value) => {
            const selected = WORK_SPHERE_MOCK_OPTIONS.find((option) => option.label === value)
            setDraft((prev) => ({
              ...prev,
              workFields: selected ? [selected.value] : value ? [value] : [],
            }))
          }}
          options={WORK_SPHERE_MOCK_OPTIONS.map((option) => option.label)}
          placeholder="Не указано"
          ariaLabel="Сфера работы"
        />

        <ProfileAutocompleteRow
          label="Образование"
          value={educationLevelLabel}
          onChange={(value) => {
            const selected = EDUCATION_LEVEL_OPTIONS.find((option) => option.label === value)
            setDraft((prev) => ({
              ...prev,
              educationLevel: selected?.value ?? (value ? prev.educationLevel : null),
              educationInstitution:
                selected?.value === 'higher' ? prev.educationInstitution : '',
            }))
          }}
          options={EDUCATION_LEVEL_OPTIONS.map((option) => option.label)}
          placeholder="Не указано"
          ariaLabel="Образование"
        />

        {isHigherEducation && (
          <ProfileAutocompleteRow
            label="ВУЗ"
            value={draft.educationInstitution}
            onChange={(value) => setDraft((prev) => ({ ...prev, educationInstitution: value }))}
            options={universityNames}
            placeholder="Не указано"
            ariaLabel="Учебное заведение"
          />
        )}
      </div>

      {filtersMetadata?.map((category) => (
        <div key={category.slug} className="rounded-[28px] px-4 py-3.5">
          <p className="mb-3 text-sm font-normal text-white">{category.name}</p>
          <div className="space-y-3">
            {category.subcategories.map((subcategory) => {
              const selectedSlugs = draft.filters?.[category.slug]?.[subcategory.slug] ?? []
              return (
                <div key={`${category.slug}:${subcategory.slug}`}>
                  <p className="mb-2 text-[13px] font-[160] text-muted-foreground">
                    {subcategory.name}
                  </p>
                  <div className="-mx-1 w-auto min-w-0 max-w-none overflow-x-auto overflow-y-hidden px-1 no-scrollbar">
                    <div className="inline-flex min-w-max gap-2 pr-1">
                      {subcategory.options.map((option) => {
                        const selected = selectedSlugs.includes(option.slug)
                        return (
                          <button
                            key={option.slug}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? selectedSlugs.filter((slug) => slug !== option.slug)
                                : [...selectedSlugs, option.slug]
                              setDraft((prev) => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  [category.slug]: {
                                    ...(prev.filters?.[category.slug] ?? {}),
                                    [subcategory.slug]: next,
                                  },
                                },
                              }))
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
