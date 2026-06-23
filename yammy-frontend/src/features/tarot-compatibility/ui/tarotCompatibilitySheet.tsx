import type { JSX } from 'react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

import {
  useCreateTarotCompatibility,
  useTarotCompatibilityWithPartner,
} from '@/entities/tarot-compatibility'
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

const SHEET_BUTTON_EDGE_INSET_CLASS = 'w-3 shrink-0 snap-start'
const SHEET_BUTTON_EDGE_INSET_END_CLASS = 'w-3 shrink-0 snap-end'
const SHEET_BUTTON_PEEK_ITEM_CLASS = 'shrink-0 snap-start min-w-[calc(100%-3.5rem)]'

function ShufflingDeckText(): JSX.Element {
  const [dotCount, setDotCount] = useState(1)

  useEffect(() => {
    const id = window.setInterval(() => {
      setDotCount((count) => (count % 3) + 1)
    }, 500)

    return () => window.clearInterval(id)
  }, [])

  return (
    <p className="text-center text-[13px] font-[200] text-muted-foreground">
      Колода перемешивается{'.'.repeat(dotCount)}
      <br />
      Можно закрыть — расклад продолжится в фоне.
    </p>
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

  const handleRestart = useCallback(() => {
    if (!data || data.remainingToday <= 0 || createMutation.isPending) return

    createMutation.mutate({
      partner_user_id: partnerUserId,
      force_new: true,
    })
  }, [createMutation, data, partnerUserId])

  const item = data?.item
  const isSearching =
    item?.status === 'searching' || createMutation.isPending || (isLoading && !item)
  const isReady = item?.status === 'ready' && item.result
  const isFailed = item?.status === 'failed'
  const canRestart =
    !isSearching && data != null && data.remainingToday > 0 && (isReady || isFailed)
  const isQuotaExceeded =
    !isLoading &&
    data != null &&
    data.remainingToday <= 0 &&
    item?.status !== 'ready' &&
    item?.status !== 'searching'

  return (
    <div className="w-full max-w-md rounded-t-[28px] border-t border-border/30 bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_32px_rgba(0,0,0,0.35)]">
      <div className="mb-4 min-w-0">
        <h2 className="text-[15px] font-[200] text-foreground">Расклад таро</h2>
        <p className="mt-1 text-[12px] font-[200] text-muted-foreground">
          Совместимость с {partnerName}
        </p>
      </div>

      <div className="max-h-[min(70vh,560px)] overflow-y-auto no-scrollbar">
        {isError && (
          <p className="mb-4 text-[13px] font-[200] text-red-400">
            Не удалось загрузить расклад. Попробуйте позже.
          </p>
        )}

        {isSearching && (
          <div className="flex flex-col items-center py-8">
            <ShufflingDeckText />
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

            {data != null && data.remainingToday <= 0 && (
              <p className="text-center text-[12px] font-[200] text-muted-foreground">
                {TAROT_QUOTA_MESSAGE}
              </p>
            )}
          </div>
        )}
      </div>

      {canRestart ? (
        <div className="-mx-5 mt-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          <div className="flex gap-2">
            <div className={SHEET_BUTTON_EDGE_INSET_CLASS} aria-hidden />
            <div className={SHEET_BUTTON_PEEK_ITEM_CLASS}>
              <Button
                type="button"
                variant="default"
                size="default"
                className="w-full rounded-full"
                disabled={createMutation.isPending}
                onClick={handleRestart}
              >
                Перезапустить расклад
              </Button>
            </div>
            <div className={SHEET_BUTTON_PEEK_ITEM_CLASS}>
              <Button
                type="button"
                variant="default"
                size="default"
                className="w-full rounded-full border-0 bg-white text-black hover:bg-white/90"
                onClick={close}
              >
                Закрыть
              </Button>
            </div>
            <div className={SHEET_BUTTON_EDGE_INSET_END_CLASS} aria-hidden />
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="default"
          size="default"
          className="mt-4 w-full rounded-full"
          onClick={close}
        >
          Закрыть
        </Button>
      )}
    </div>
  )
}

export const TarotCompatibilitySheetContentMemo = memo(TarotCompatibilitySheetContent)
