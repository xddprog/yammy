import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useTelegram } from '@/app/providers/TelegramProvider'
import { useFiltersMetadata } from '@/entities/user/hooks/useFiltersMetadata'
import type { ProfilePhotoItem } from '@/entities/user/types/types'
import {
  completeOnboarding,
  type LocalOnboardingPhoto,
} from '@/features/onboarding/lib/completeOnboarding'
import {
  clearOnboardingSession,
  loadOnboardingDraft,
  loadOnboardingStep,
  saveOnboardingDraft,
  saveOnboardingStep,
  type OnboardingDraft,
  type OnboardingStep,
} from '@/features/onboarding/lib/onboardingDraft'
import { OnboardingLayout } from '@/features/onboarding/ui/OnboardingLayout'
import { OnboardingTraitChips } from '@/features/onboarding/ui/OnboardingTraitChips'
import { ProfileEditSheetRow } from '@/pages/(main)/profilePage/ui/components/profileEditSheetRow'
import { ProfilePhotosEditor } from '@/pages/(main)/profilePage/ui/components/profilePhotosEditor'
import {
  EDUCATION_LEVEL_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
} from '@/pages/(main)/profilePage/ui/components/profile.constants'
import { usersQueryKeys } from '@/entities/user/lib/usersQueryKeys'
import { ERouteNames } from '@/shared/lib/routeVariables'
import { showErrorToast } from '@/shared'
import { useQueryClient } from '@tanstack/react-query'

function isFilledText(value: string): boolean {
  return value.trim().length > 0
}

function photosStepReady(
  photos: ProfilePhotoItem[],
  files: Map<string, File>,
): boolean {
  const main = photos.find((p) => p.is_main && !p.uploadStatus)
  return Boolean(main && files.has(main.id))
}

const OnboardingPage = (): JSX.Element => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const tg = useTelegram()
  const { data: filtersMetadata } = useFiltersMetadata()
  const photoFilesRef = useRef<Map<string, File>>(new Map())

  const [step, setStep] = useState<OnboardingStep>(() => loadOnboardingStep())
  const [draft, setDraft] = useState<OnboardingDraft>(() => loadOnboardingDraft())
  const [photos, setPhotos] = useState<ProfilePhotoItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const firstName = tg?.initDataUnsafe?.user?.first_name?.trim()
    if (firstName && !draft.name.trim()) {
      setDraft((prev) => {
        const next = { ...prev, name: firstName }
        saveOnboardingDraft(next)
        return next
      })
    }
  }, [tg, draft.name])

  const persistDraft = useCallback((next: OnboardingDraft) => {
    setDraft(next)
    saveOnboardingDraft(next)
  }, [])

  const goStep = useCallback((next: OnboardingStep) => {
    setStep(next)
    saveOnboardingStep(next)
  }, [])

  const step1Valid = useMemo(
    () =>
      isFilledText(draft.name) &&
      draft.age != null &&
      draft.age >= 16 &&
      draft.gender != null,
    [draft.name, draft.age, draft.gender],
  )

  const step2Valid = useMemo(
    () => photosStepReady(photos, photoFilesRef.current),
    [photos],
  )

  const isHigherEducation = draft.educationLevel === 'higher'

  const step3Valid = useMemo(
    () =>
      isFilledText(draft.city) &&
      draft.educationLevel != null &&
      draft.relationshipGoal != null,
    [draft.city, draft.educationLevel, draft.relationshipGoal],
  )

  const step4Valid = useMemo(() => draft.filterOptionIds.length >= 1, [draft.filterOptionIds])

  const finishOnboarding = async (): Promise<void> => {
    if (!filtersMetadata?.length) {
      showErrorToast('Не удалось загрузить каталог характеристик')
      return
    }
    const localPhotos: LocalOnboardingPhoto[] = [...photos]
      .sort((a, b) => a.order - b.order)
      .map((photo) => {
        const localFile = photoFilesRef.current.get(photo.id)
        if (!localFile) {
          throw new Error('Фото не найдено')
        }
        return { ...photo, localFile }
      })

    setSubmitting(true)
    try {
      await completeOnboarding(draft, localPhotos, true)
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.profile() })
      clearOnboardingSession()
      navigate(`/${ERouteNames.DASHBOARD_ROUTE}`, { replace: true })
    } catch {
      /* toast from API */
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 1) {
    return (
      <OnboardingLayout
        title="О вас"
        step={1}
        totalSteps={4}
        primaryLabel="Далее"
        primaryDisabled={!step1Valid}
        footerNote="Вам должно быть не менее 16 лет"
        onPrimary={() => goStep(2)}
      >
        <div className="flex flex-col gap-1.5">
          <ProfileEditSheetRow
            mode="text"
            label="Имя"
            value={draft.name}
            onApply={(value) => persistDraft({ ...draft, name: value })}
            textPlaceholder="Как вас зовут"
            placeholder="Не указано"
            ariaLabel="Имя"
          />
          <ProfileEditSheetRow
            mode="age"
            label="Возраст"
            value={draft.age != null ? String(draft.age) : ''}
            onApplyAge={(age) => persistDraft({ ...draft, age })}
            placeholder="Не указано"
            ariaLabel="Возраст"
          />
          <ProfileEditSheetRow
            mode="pick"
            label="Пол"
            displayValue={draft.gender ?? ''}
            options={['Мужской', 'Женский']}
            onPick={(label) =>
              persistDraft({
                ...draft,
                gender: label ? (label as 'Мужской' | 'Женский') : null,
              })
            }
            placeholder="Не указано"
            ariaLabel="Пол"
          />
        </div>
      </OnboardingLayout>
    )
  }

  if (step === 2) {
    return (
      <OnboardingLayout
        title="Добавьте фото"
        step={2}
        totalSteps={4}
        primaryLabel="Далее"
        primaryDisabled={!step2Valid}
        onBack={() => goStep(1)}
        onPrimary={() => goStep(3)}
      >
        <p className="mb-4 text-sm font-light text-muted-foreground">
          Минимум одно, на главном — ваше лицо
        </p>
        <ProfilePhotosEditor
          photos={photos}
          setPhotos={setPhotos}
          storage="local"
          photoFilesRef={photoFilesRef}
        />
      </OnboardingLayout>
    )
  }

  if (step === 3) {
    return (
      <OnboardingLayout
        title="Локация и цель"
        step={3}
        totalSteps={4}
        primaryLabel="Далее"
        primaryDisabled={!step3Valid}
        onBack={() => goStep(2)}
        onPrimary={() => goStep(4)}
      >
        <div className="flex flex-col gap-1.5">
          <ProfileEditSheetRow
            mode="city"
            label="Город"
            value={draft.city}
            onApply={(value) => persistDraft({ ...draft, city: value })}
            placeholder="Не указано"
            ariaLabel="Город"
          />
          <ProfileEditSheetRow
            mode="pick"
            label="Образование"
            displayValue={draft.educationLabel}
            options={EDUCATION_LEVEL_OPTIONS.map((o) => o.label)}
            onPick={(label) => {
              const selected = EDUCATION_LEVEL_OPTIONS.find((o) => o.label === label)
              persistDraft({
                ...draft,
                educationLevel: selected?.value ?? null,
                educationLabel: label,
                educationInstitution:
                  selected?.value === 'higher' ? draft.educationInstitution : '',
              })
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
              onApply={(value) => persistDraft({ ...draft, educationInstitution: value })}
              placeholder="Не указано"
              ariaLabel="Учебное заведение"
            />
          )}
          <ProfileEditSheetRow
            mode="pick"
            label="Цель отношений"
            displayValue={draft.relationshipGoalLabel}
            options={RELATIONSHIP_GOAL_OPTIONS.map((o) => o.label)}
            onPick={(label) => {
              const selected = RELATIONSHIP_GOAL_OPTIONS.find((o) => o.label === label)
              persistDraft({
                ...draft,
                relationshipGoal: selected?.value ?? null,
                relationshipGoalLabel: label,
              })
            }}
            placeholder="Не указано"
            ariaLabel="Цель отношений"
          />
        </div>
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout
      title="Интересы"
      step={4}
      totalSteps={4}
      primaryLabel="Готово"
      primaryDisabled={!step4Valid}
      primaryLoading={submitting}
      onBack={() => goStep(3)}
      onPrimary={() => void finishOnboarding()}
    >
      {filtersMetadata ? (
        <OnboardingTraitChips
          categories={filtersMetadata}
          draft={draft}
          onChange={persistDraft}
          uiLang="ru"
        />
      ) : null}
      <div className="mt-4 flex flex-col gap-1.5">
        <ProfileEditSheetRow
          mode="longtext"
          label="О себе"
          value={draft.bio}
          onApply={(value) => persistDraft({ ...draft, bio: value })}
          textPlaceholder="Несколько предложений о себе"
          placeholder="Не указано"
          ariaLabel="О себе"
        />
      </div>
    </OnboardingLayout>
  )
}

export default OnboardingPage
