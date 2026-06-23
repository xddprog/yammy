import type { JSX } from 'react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'

import {
  AI_SEARCH_GENDER_TO_API,
  type AiSearchCreatePayload,
  type AiSearchTargetGender,
} from '@/entities/ai-search'
import { useUserProfile } from '@/entities/user/hooks/useUserProfile'
import { GENDER_OPTIONS, type GenderOption } from '@/features/matches-filter/lib/constants'
import { getOppositeSearchGender } from '@/features/matches-filter/lib/searchGenderDefaults'
import { Button, cn, showErrorToast } from '@/shared'

/** Как у фильтров: панель вплотную к низу экрана, safe-area — внутри sheet. */
const PANEL_CLASS =
  'relative w-full min-w-0 max-w-md flex items-end !h-auto max-h-[92vh] !bg-transparent shadow-none'

export interface AiSearchStartSheetContentProps {
  close: () => void
  onSubmit: (payload: AiSearchCreatePayload) => Promise<void>
  isSubmitting?: boolean
}

const AiSearchStartSheetContent = ({
  close,
  onSubmit,
  isSubmitting = false,
}: AiSearchStartSheetContentProps): JSX.Element => {
  const { data: profile } = useUserProfile()
  const defaultGender = useMemo<GenderOption>(() => {
    const opposite = profile?.gender ? getOppositeSearchGender(profile.gender) : null
    return opposite ?? 'Женский'
  }, [profile?.gender])

  const [query, setQuery] = useState('')
  const [gender, setGender] = useState<GenderOption>(defaultGender)
  const submitInFlightRef = useRef(false)
  const maxLen = 500

  useEffect(() => {
    setGender(defaultGender)
  }, [defaultGender])

  const handleSubmit = (): void => {
    if (submitInFlightRef.current || isSubmitting) return

    const trimmed = query.trim()
    const targetGender: AiSearchTargetGender = AI_SEARCH_GENDER_TO_API[gender]

    submitInFlightRef.current = true
    void onSubmit({
      query_text: trimmed,
      target_gender: targetGender,
    })
      .then(() => close())
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Не удалось запустить поиск'
        showErrorToast(message)
      })
      .finally(() => {
        submitInFlightRef.current = false
      })
  }

  return (
    <div className="w-full max-w-md rounded-t-[28px] border-t border-border/30 bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_32px_rgba(0,0,0,0.35)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-[200] text-foreground">Новый умный поиск</h2>
        <button
          type="button"
          onClick={close}
          className="text-[13px] font-[200] text-muted-foreground"
          aria-label="Закрыть"
        >
          Закрыть
        </button>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[13px] font-[200] text-muted-foreground">Кого ищем</p>
        <div className="flex gap-2" role="group" aria-label="Пол">
          {GENDER_OPTIONS.map((option) => {
            const selected = gender === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => setGender(option)}
                className={cn(
                  'flex-1 rounded-full px-4 py-2.5 text-sm font-light transition-colors touch-manipulation',
                  selected
                    ? 'bg-[#FF6BA4]/20 text-foreground border border-[#FF6BA4]/40'
                    : 'bg-card text-muted-foreground border border-transparent',
                )}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      <p className="mb-3 text-[13px] font-[200] leading-snug text-muted-foreground">
        Тут вы можете написать ваши пожелания к поиску
      </p>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value.slice(0, maxLen))}
        placeholder="Например: спортивная, любит путешествия…"
        rows={4}
        className={cn(
          'mb-2 w-full resize-none rounded-[24px] bg-card px-4 py-3 text-[14px] font-[200] text-foreground',
          'outline-none ring-1 ring-inset ring-border/30 placeholder:text-muted-foreground',
        )}
      />
      <p className="mb-4 text-right text-[11px] font-[200] text-muted-foreground">
        {query.length}/{maxLen}
      </p>
      <Button
        type="button"
        variant="default"
        size="lg"
        className="mb-1 w-full rounded-full"
        disabled={isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? 'Запускаем…' : 'Запустить'}
      </Button>
      <p className="pb-1 text-center text-[11px] font-[200] text-muted-foreground">
        Можно закрыть приложение — результат появится в истории
      </p>
    </div>
  )
}

export const AiSearchStartSheetContentMemo = memo(AiSearchStartSheetContent)

export const AI_SEARCH_START_SHEET_PANEL_CLASS = PANEL_CLASS
