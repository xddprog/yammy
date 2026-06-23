import { Sparkles } from 'lucide-react'
import type { JSX } from 'react'

import { Button } from '@/shared'

interface AiSearchQuotaCardProps {
  remainingToday: number
  onStart: () => void
  onSubscribe: () => void
  onBuyRuns: () => void
}

function formatRunsCount(count: number): string {
  if (count === 1) return '1 запуск'
  if (count >= 2 && count <= 4) return `${count} запуска`
  return `${count} запусков`
}

export const AiSearchQuotaCard = ({
  remainingToday,
  onStart,
  onSubscribe,
  onBuyRuns,
}: AiSearchQuotaCardProps): JSX.Element => {
  const renderCta = (): JSX.Element => {
    if (remainingToday > 0) {
      return (
        <Button
          type="button"
          variant="default"
          size="default"
          className="w-full rounded-full shadow-lg shadow-[#FF6BA4]/25"
          onClick={onStart}
        >
          Начать поиск
        </Button>
      )
    }

    const edgeInsetClass = 'w-3 shrink-0 snap-start'
    const edgeInsetEndClass = 'w-3 shrink-0 snap-end'
    const peekItemClass = 'shrink-0 snap-start min-w-[calc(100%-3.5rem)]'
    return (
      <div className="-mx-5 mt-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        <div className="flex gap-2">
          <div className={edgeInsetClass} aria-hidden />
          <div className={peekItemClass}>
            <Button
              type="button"
              variant="default"
              size="default"
              className="w-full rounded-full"
              onClick={onSubscribe}
            >
              Оформить подписку
            </Button>
          </div>
          <div className={peekItemClass}>
            <Button
              type="button"
              variant="black"
              size="default"
              className="w-full rounded-full"
              onClick={onBuyRuns}
            >
              Купить запуски
            </Button>
          </div>
          <div className={edgeInsetEndClass} aria-hidden />
        </div>
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-[30px] bg-white p-5 text-black">
      <div className="mb-4 flex items-end justify-between gap-3">
        <p className="text-[28px] font-bold uppercase leading-none tracking-tight">AI поиск</p>
        <Sparkles className="size-10 shrink-0 text-[#FF6BA4]" strokeWidth={1.5} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-[300] uppercase tracking-[0.04em] text-muted-foreground">
          Осталось сегодня
        </p>
        <p className="text-right text-[13px] font-bold leading-none">
          {formatRunsCount(remainingToday)}
        </p>
      </div>

      <div className="mt-4">{renderCta()}</div>
    </section>
  )
}
