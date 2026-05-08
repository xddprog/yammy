import type React from 'react'
import { useRef } from 'react'
import { X } from 'lucide-react'

import { useFiltersMetadata } from '@/entities/user/hooks/useFiltersMetadata'
import type { FiltersState } from '@/features/matches-filter/model/types'
import { Image, cn } from '@/shared'
import { triggerHaptic } from '@/shared/lib/haptics'

import {
  CITY_MOCK_OPTIONS,
  EDUCATION_INSTITUTION_MOCK_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  MAX_PROFILE_PHOTOS,
  RELATIONSHIP_GOAL_OPTIONS,
  WORK_SPHERE_MOCK_OPTIONS,
} from './profile.constants'
import type { ProfilePhotoItem } from '../profilePage'
import { ProfileAutocompleteRow } from './profileAutocompleteRow'

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
  const draggedPhotoIdRef = useRef<string | null>(null)
  const photosInputRef = useRef<HTMLInputElement>(null)
  const holdTimerRef = useRef<number | null>(null)
  const didTriggerHoldHapticRef = useRef(false)
  const transparentDragImageRef = useRef<HTMLImageElement | null>(null)
  const nonMainPhotos = photos.filter((photo) => !photo.isMain)
  const emptySlots = Math.max(0, MAX_PROFILE_PHOTOS - nonMainPhotos.length)
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

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id))
  }

  const clearHoldTimer = () => {
    if (holdTimerRef.current != null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <input
        ref={photosInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const selected = Array.from(event.target.files ?? [])
          if (!selected.length) return
          setPhotos((prev) => {
            const currentNonMain = prev.filter((photo) => !photo.isMain)
            const available = Math.max(0, MAX_PROFILE_PHOTOS - currentNonMain.length)
            const nextFiles = selected.slice(0, available)
            const nextPhotos = nextFiles.map((file, index) => ({
              id: `photo-upload-${Date.now()}-${index}`,
              url: URL.createObjectURL(file),
              isMain: false,
            }))
            return [...prev, ...nextPhotos]
          })
          event.currentTarget.value = ''
        }}
      />

      <div className="rounded-[28px] bg-card p-3">
        <div className="-mx-1 px-1">
          <div className="flex min-w-0 gap-2 overflow-x-auto overflow-y-visible px-1 pb-3 -mb-3 no-scrollbar">
          {nonMainPhotos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onPointerDown={() => {
                didTriggerHoldHapticRef.current = false
                clearHoldTimer()
                holdTimerRef.current = window.setTimeout(() => {
                  didTriggerHoldHapticRef.current = true
                  triggerHaptic()
                }, 180)
              }}
              onPointerUp={clearHoldTimer}
              onPointerLeave={clearHoldTimer}
              onPointerCancel={clearHoldTimer}
              onDragStart={(event) => {
                clearHoldTimer()
                if (!didTriggerHoldHapticRef.current) {
                  triggerHaptic()
                }
                if (!transparentDragImageRef.current) {
                  const image = new window.Image()
                  image.src =
                    'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E'
                  transparentDragImageRef.current = image
                }
                const dragImage = transparentDragImageRef.current
                if (dragImage) {
                  event.dataTransfer.setDragImage(dragImage, 0, 0)
                }
                draggedPhotoIdRef.current = photo.id
              }}
              onDragOver={(event) => {
                event.preventDefault()
              }}
              onDrop={(event) => {
                event.preventDefault()
                const draggedId = draggedPhotoIdRef.current
                if (!draggedId || draggedId === photo.id) return
                setPhotos((prev) => {
                  const main = prev.find((item) => item.isMain)
                  const nonMain = prev.filter((item) => !item.isMain)
                  const from = nonMain.findIndex((item) => item.id === draggedId)
                  const to = nonMain.findIndex((item) => item.id === photo.id)
                  if (from < 0 || to < 0) return prev
                  const reordered = [...nonMain]
                  const [moved] = reordered.splice(from, 1)
                  reordered.splice(to, 0, moved)
                  return main ? [main, ...reordered] : reordered
                })
                draggedPhotoIdRef.current = null
              }}
              className="relative h-[130px] w-[90px] shrink-0 overflow-visible"
            >
              <div className="h-full w-full overflow-hidden rounded-[18px] bg-transparent">
                <Image
                  src={photo.url}
                  alt={`Доп фото ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full bg-[#FF4F88] text-white shadow-lg"
                aria-label="Удалить фото"
              >
                <X className="size-5" />
              </button>
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <button
              key={`empty-slot-${index}`}
              type="button"
              onClick={() => photosInputRef.current?.click()}
              className="flex h-[130px] w-[90px] shrink-0 items-center justify-center rounded-[18px] bg-[#0D0D0D] text-muted-foreground"
            >
              <span className="text-[34px] leading-none">+</span>
            </button>
          ))}
          </div>
        </div>
      </div>

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
        options={CITY_MOCK_OPTIONS}
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
            educationInstitution: selected?.value === 'higher' ? prev.educationInstitution : '',
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
          options={EDUCATION_INSTITUTION_MOCK_OPTIONS}
          placeholder="Не указано"
          ariaLabel="Учебное заведение"
        />
      )}

      {filtersMetadata?.map((category) => (
        <div key={category.slug} className="rounded-[28px] px-4 py-3.5">
          <p className="mb-3 text-sm font-normal text-muted-foreground">{category.name}</p>
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
