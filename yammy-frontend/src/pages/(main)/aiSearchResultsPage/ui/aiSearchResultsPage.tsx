import { ChevronLeft } from 'lucide-react'
import type { JSX } from 'react'
import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAiSearchFeed, useAiSearchJob } from '@/entities/ai-search'
import { AppPageLoader } from '@/app/ui/AppPageLoader'
import { AiSearchResultsFeedMemo } from '@/features/ai-search'
import { Button, cn, ERouteNames } from '@/shared'
import { stickyTopHeaderClassNames } from '@/widgets'

const pageColumnClassName = cn(
  'flex h-full min-h-0 flex-col px-4 pt-[95px]',
  'pb-[max(1rem,env(safe-area-inset-bottom,0px))]',
)

const emptyStateClassName = cn(
  'flex flex-1 items-center justify-center px-6 text-center text-[14px] font-[200] text-muted-foreground',
)

const AiSearchResultsPage = (): JSX.Element => {
  const navigate = useNavigate()
  const { jobId } = useParams<{ jobId: string }>()
  const jobQuery = useAiSearchJob(jobId)
  const feedQuery = useAiSearchFeed(jobId)
  const [feedEnded, setFeedEnded] = useState(false)

  const job = jobQuery.data
  const feedUsers = feedQuery.data ?? []
  const highlights = job?.results?.highlights ?? {}

  const goBack = useCallback(() => {
    navigate(`/${ERouteNames.AI_SEARCH_ROUTE}`)
  }, [navigate])

  const isLoading = jobQuery.isPending || feedQuery.isPending
  const isReady = job?.status === 'ready'
  const hasFeed = feedUsers.length > 0

  if (isLoading) {
    return (
      <div className={pageColumnClassName}>
        <header className={stickyTopHeaderClassNames({ variant: 'background' })} aria-hidden />
        <div className="flex flex-1 items-center justify-center">
          <AppPageLoader />
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className={pageColumnClassName}>
        <header className={stickyTopHeaderClassNames({ variant: 'background' })} aria-hidden />
        <button
          type="button"
          onClick={goBack}
          className="mb-4 flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-card/85 active:scale-95"
          aria-label="Назад"
        >
          <ChevronLeft className="size-5" strokeWidth={2} />
        </button>
        <div className={emptyStateClassName}>Запуск не найден</div>
      </div>
    )
  }

  if (!isReady || !hasFeed) {
    return (
      <div className={pageColumnClassName}>
        <header className={stickyTopHeaderClassNames({ variant: 'background' })} aria-hidden />
        <button
          type="button"
          onClick={goBack}
          className="mb-4 flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-card/85 active:scale-95"
          aria-label="Назад"
        >
          <ChevronLeft className="size-5" strokeWidth={2} />
        </button>
        <div className={emptyStateClassName}>
          {!isReady ? 'Результат ещё готовится' : 'В этом запуске нет анкет для показа'}
        </div>
        <Button type="button" variant="default" size="default" className="mt-4 w-full rounded-full" onClick={goBack}>
          К истории поиска
        </Button>
      </div>
    )
  }

  return (
    <div className={cn(pageColumnClassName, 'relative')}>
      <header className={stickyTopHeaderClassNames({ variant: 'background' })} aria-hidden />

      <button
        type="button"
        onClick={goBack}
        className="mb-3 flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-card/85 active:scale-95"
        aria-label="Назад к AI поиску"
      >
        <ChevronLeft className="size-5" strokeWidth={2} />
      </button>

      <div className="min-h-0 flex-1">
        <AiSearchResultsFeedMemo
          items={feedUsers}
          highlights={highlights}
          onEmpty={() => setFeedEnded(true)}
        />
      </div>

      {feedEnded && (
        <div className="pointer-events-none absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-20 flex justify-center">
          <p className="rounded-full bg-card/95 px-4 py-2 text-center text-[13px] font-[200] text-muted-foreground">
            Анкеты из этого поиска закончились
          </p>
        </div>
      )}
    </div>
  )
}

export default AiSearchResultsPage
