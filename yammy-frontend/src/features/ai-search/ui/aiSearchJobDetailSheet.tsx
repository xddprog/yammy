import { X } from 'lucide-react'
import type { JSX } from 'react'
import { memo } from 'react'

import {
  canOpenAiSearchResults,
  shouldShowAiSearchFailure,
  type AiSearchJob,
} from '@/entities/ai-search'
import { Button } from '@/shared'

import { getAiSearchFailureMessage } from '../lib/aiSearchUserMessages'
import { formatJobDate, formatJobStatus } from '../lib/formatJobStatus'

export interface AiSearchJobDetailSheetContentProps {
  job: AiSearchJob
  close: () => void
  onOpenResults?: () => void
}

function formatDuration(job: AiSearchJob): string {
  if (!job.completedAt) return 'В процессе'
  const startedMs = Date.parse(job.createdAt)
  const completedMs = Date.parse(job.completedAt)
  if (!Number.isFinite(startedMs) || !Number.isFinite(completedMs) || completedMs <= startedMs) return '—'

  const totalSeconds = Math.round((completedMs - startedMs) / 1000)
  if (totalSeconds < 60) return `${totalSeconds} сек`

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return seconds === 0 ? `${minutes} мин` : `${minutes} мин ${seconds} сек`
}

function getMatchQuality(job: AiSearchJob): string {
  const count = job.resultCount ?? 0
  if (count <= 0) return 'Оцениваем'
  if (count >= 12) return 'Высокое'
  if (count >= 6) return 'Среднее'
  return 'Точечное'
}

const AiSearchJobDetailSheetContent = ({
  job,
  close,
  onOpenResults,
}: AiSearchJobDetailSheetContentProps): JSX.Element => {
  const canOpenResults = canOpenAiSearchResults(job) && Boolean(onOpenResults)
  const isActive = job.status === 'queued' || job.status === 'parsing' || job.status === 'searching'
  const statusLabel = canOpenAiSearchResults(job) ? 'Готово' : formatJobStatus(job.status)

  return (
    <div className="w-full max-w-md rounded-t-[28px] border-t border-border/30 bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_32px_rgba(0,0,0,0.35)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-[200] text-foreground">Детали запуска</h2>
          <p className="mt-1 text-[12px] font-[200] text-muted-foreground">
            {statusLabel} · {formatJobDate(job.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-card/85 active:scale-95"
          aria-label="Закрыть детали"
        >
          <X className="size-5" strokeWidth={2} />
        </button>
      </div>

      {shouldShowAiSearchFailure(job) && (
        <p className="mb-3 text-[13px] font-[200] text-red-400">
          {getAiSearchFailureMessage(job.errorMessage)}
        </p>
      )}

      {isActive && (
        <p className="mb-3 text-[13px] font-[200] text-muted-foreground">
          Поиск выполняется. Обновим статус автоматически — можно закрыть этот экран.
        </p>
      )}

      <div className="mb-2 grid grid-cols-1 gap-2">
        <div className="rounded-[18px] bg-card px-3 py-3">
          <p className="text-[11px] font-[200] uppercase tracking-[0.04em] text-muted-foreground">Пожелания</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-[13px] font-[200] leading-snug text-foreground">
            {job.queryText.trim() || 'Без пожеланий'}
          </p>
        </div>
        <div className="rounded-[18px] bg-card px-3 py-3">
          <p className="text-[11px] font-[200] uppercase tracking-[0.04em] text-muted-foreground">Найдено анкет</p>
          <p className="mt-1 text-[13px] font-[200] text-foreground">{job.resultCount ?? '—'}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2">
        <div className="rounded-[18px] bg-card px-3 py-3">
          <p className="text-[11px] font-[200] uppercase tracking-[0.04em] text-muted-foreground">
            Время выполнения
          </p>
          <p className="mt-1 text-[13px] font-[200] text-foreground">{formatDuration(job)}</p>
        </div>
        <div className="rounded-[18px] bg-card px-3 py-3">
          <p className="text-[11px] font-[200] uppercase tracking-[0.04em] text-muted-foreground">
            Качество совпадений
          </p>
          <p className="mt-1 text-[13px] font-[200] text-foreground">{getMatchQuality(job)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {canOpenResults && (
          <Button
            type="button"
            variant="default"
            size="default"
            className="w-full rounded-full"
            onClick={onOpenResults}
          >
            Посмотреть
          </Button>
        )}
      </div>
    </div>
  )
}

export const AiSearchJobDetailSheetContentMemo = memo(AiSearchJobDetailSheetContent)
