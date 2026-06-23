import { Sparkles } from 'lucide-react'
import type { CSSProperties, JSX } from 'react'
import { memo, useEffect, useRef } from 'react'

import {
  useCreateTarotCompatibility,
  useTarotCompatibilityWithPartner,
} from '@/entities/tarot-compatibility'
import { AppPageLoader } from '@/app/ui/AppPageLoader'
import { Button } from '@/shared'

import {
  getTarotCompatibilityFailureMessage,
  TAROT_QUOTA_MESSAGE,
} from '../lib/tarotCompatibilityMessages'

const POSITION_LABELS: Record<string, string> = {
  past: 'Прошлое',
  present: 'Настоящее',
  future: 'Будущее',
}

function CompatibilityScoreRing({ score }: { score: number }): JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const angle = (clamped / 100) * 360

  return (
    <div className="relative mx-auto aspect-square w-[120px]">
      <div
        className="absolute inset-0 rounded-full"
        style={
          {
            '--progress-angle': `${angle}deg`,
            backgroundImage:
              'conic-gradient(#FF6BA4 var(--progress-angle), transparent var(--progress-angle))',
            WebkitMaskImage:
              'radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 6px))',
            maskImage:
              'radial-gradient(farthest-side, transparent calc(100% - 8px), #000 calc(100% - 6px))',
          } as CSSProperties
        }
        aria-hidden
      />
      <div className="relative m-[10px] flex h-[calc(100%-20px)] w-[calc(100%-20px)] items-center justify-center rounded-full bg-[#FF6BA4]">
        <span className="text-[28px] font-semibold text-white">{clamped}%</span>
      </div>
    </div>
  )
}

export interface TarotCompatibilitySheetContentProps {
  partnerUserId: string
  partnerName: string
  close: () => void
}

const TarotCompatibilitySheetContent = ({
  partnerUserId,
  partnerName,
  close,
}: TarotCompatibilitySheetContentProps): JSX.Element => {
  const createAttemptedRef = useRef(false)
  const { data, isLoading, isError } = useTarotCompatibilityWithPartner(partnerUserId)
  const createMutation = useCreateTarotCompatibility()

  useEffect(() => {
    if (isLoading || !data || createAttemptedRef.current || createMutation.isPending) return

    const item = data.item
    if (item?.status === 'ready' || item?.status === 'searching') return
    if (data.remainingToday <= 0) return

    createAttemptedRef.current = true
    createMutation.mutate({ partner_user_id: partnerUserId })
  }, [createMutation, data, isLoading, partnerUserId])

  const item = data?.item
  const isSearching =
    item?.status === 'searching' || createMutation.isPending || (isLoading && !item)
  const isReady = item?.status === 'ready' && item.result
  const isFailed = item?.status === 'failed'
  const isQuotaExceeded =
    !isLoading &&
    data != null &&
    data.remainingToday <= 0 &&
    item?.status !== 'ready' &&
    item?.status !== 'searching'

  return (
    <div className="w-full max-w-md rounded-t-[28px] border-t border-border/30 bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_32px_rgba(0,0,0,0.35)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-[200] text-foreground">Расклад таро</h2>
          <p className="mt-1 text-[12px] font-[200] text-muted-foreground">
            Совместимость с {partnerName}
          </p>
        </div>
        <Sparkles className="size-8 shrink-0 text-[#FF6BA4]" strokeWidth={1.5} />
      </div>

      <div className="max-h-[min(70vh,560px)] overflow-y-auto no-scrollbar">
        {isError && (
          <p className="mb-4 text-[13px] font-[200] text-red-400">
            Не удалось загрузить расклад. Попробуйте позже.
          </p>
        )}

        {isSearching && (
          <div className="flex flex-col items-center gap-4 py-8">
            <AppPageLoader />
            <p className="text-center text-[13px] font-[200] text-muted-foreground">
              Колода перемешивается…
              <br />
              Можно закрыть — расклад продолжится в фоне.
            </p>
          </div>
        )}

        {createMutation.isError && !isSearching && (
          <p className="mb-4 text-[13px] font-[200] text-red-400">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'Не удалось сделать расклад. Попробуйте позже.'}
          </p>
        )}

        {isQuotaExceeded && !isSearching && (
          <div className="py-6 text-center">
            <p className="text-[14px] font-[200] text-foreground">{TAROT_QUOTA_MESSAGE}</p>
          </div>
        )}

        {isFailed && !isSearching && (
          <p className="mb-4 text-[13px] font-[200] text-red-400">
            {getTarotCompatibilityFailureMessage(item.errorMessage)}
          </p>
        )}

        {isReady && item.result && (
          <div className="space-y-5 pb-2">
            <div className="flex justify-center">
              <CompatibilityScoreRing score={item.result.compatibility_score} />
            </div>

            <p className="text-center text-[14px] font-medium text-foreground">{item.result.summary}</p>

            <div className="grid grid-cols-3 gap-2">
              {item.result.cards.map((card) => (
                <div
                  key={card.position}
                  className="rounded-[20px] bg-card px-2 py-3 text-center ring-1 ring-inset ring-border/30"
                >
                  <p className="mb-1 text-[10px] font-[200] uppercase tracking-wide text-muted-foreground">
                    {POSITION_LABELS[card.position] ?? card.position}
                  </p>
                  <p className="mb-2 text-[12px] font-medium leading-tight text-foreground">
                    {card.name}
                  </p>
                  <p className="text-[11px] font-[200] leading-snug text-muted-foreground">
                    {card.meaning}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-[13px] font-[200] leading-relaxed text-foreground">
              {item.result.reading_text}
            </p>
          </div>
        )}
      </div>

      <Button type="button" variant="black" size="lg" className="mt-4 w-full rounded-full" onClick={close}>
        Закрыть
      </Button>
    </div>
  )
}

export const TarotCompatibilitySheetContentMemo = memo(TarotCompatibilitySheetContent)
