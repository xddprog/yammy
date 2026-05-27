import { ChevronRight } from 'lucide-react'
import type { JSX } from 'react'

import type { AiSearchJob } from '@/entities/ai-search'
import { cn } from '@/shared'

import { formatJobStatus } from '../lib/formatJobStatus'

interface AiSearchHistoryRowProps {
  job: AiSearchJob
  onClick: () => void
}

export const AiSearchHistoryRow = ({ job, onClick }: AiSearchHistoryRowProps): JSX.Element => {
  const prompt = job.queryText.trim() || job.title
  const statusLabel = formatJobStatus(job.status)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-[28px] bg-card px-4 py-7.5 text-left transition-colors',
        'hover:bg-card/85 active:scale-[0.99]',
      )}
    >
      <span className="min-w-0 flex-1 truncate text-[14px] font-[200] text-foreground">{prompt}</span>
      <span className="shrink-0 text-[12px] font-[200] text-muted-foreground">{statusLabel}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
    </button>
  )
}
