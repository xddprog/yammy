import { ChevronLeft } from 'lucide-react'
import type { JSX } from 'react'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import type { AiSearchJob } from '@/entities/ai-search'
import {
  aiSearchResultsPath,
  canOpenAiSearchResults,
  useAiSearchJobs,
  useCreateAiSearchJob,
} from '@/entities/ai-search'
import {
  AI_SEARCH_START_SHEET_PANEL_CLASS,
  AiSearchHistoryRow,
  AiSearchJobDetailSheetContentMemo,
  AiSearchQuotaCard,
  AiSearchStartSheetContentMemo,
} from '@/features/ai-search'
import { ERouteNames, showErrorToast, useOverlay } from '@/shared'
import { stickyTopHeaderClassNames } from '@/widgets'

const STUB_SOON_MESSAGE = 'Скоро будет доступно'

const AiSearchPage = (): JSX.Element => {
  const navigate = useNavigate()
  const { open } = useOverlay()
  const jobsQuery = useAiSearchJobs()
  const { mutateAsync: createAiSearchJob, isPending: isCreatingAiSearchJob } = useCreateAiSearchJob()

  const jobs = jobsQuery.data?.jobs ?? []
  const remainingToday = jobsQuery.data?.remainingToday

  const openStartSheet = useCallback(() => {
    open({
      backdropClassName: 'bg-black/50 backdrop-blur-sm',
      panelClassName: AI_SEARCH_START_SHEET_PANEL_CLASS,
      content: (close) => (
        <AiSearchStartSheetContentMemo
          close={close}
          isSubmitting={isCreatingAiSearchJob}
          onSubmit={async (query) => {
            await createAiSearchJob(query)
            showErrorToast('Поиск запущен. Можно закрыть приложение — результат появится в истории.')
          }}
        />
      ),
    })
  }, [open, createAiSearchJob, isCreatingAiSearchJob])

  const openJobDetail = useCallback(
    (job: AiSearchJob) => {
      open({
        backdropClassName: 'bg-black/50 backdrop-blur-sm',
        panelClassName: AI_SEARCH_START_SHEET_PANEL_CLASS,
        content: (close) => (
          <AiSearchJobDetailSheetContentMemo
            job={job}
            close={close}
            onOpenResults={
              canOpenAiSearchResults(job)
                ? () => {
                    close()
                    navigate(aiSearchResultsPath(job.id))
                  }
                : undefined
            }
          />
        ),
      })
    },
    [open, navigate],
  )

  const handleStubSubscribe = (): void => {
    showErrorToast(STUB_SOON_MESSAGE)
  }

  const handleStubBuyRuns = (): void => {
    showErrorToast(STUB_SOON_MESSAGE)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background px-4 text-foreground">
      <div className="min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-x-none no-scrollbar">
        <div className="flex flex-col gap-4 pb-4">
          <header
            className={stickyTopHeaderClassNames()}
            aria-hidden
          />

          <button
            type="button"
            onClick={() => navigate(`/${ERouteNames.DASHBOARD_ROUTE}`)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-card/85 active:scale-95"
            aria-label="Назад к ленте"
          >
            <ChevronLeft className="size-5" strokeWidth={2} />
          </button>

          {remainingToday !== undefined && (
            <AiSearchQuotaCard
              remainingToday={remainingToday}
              onStart={openStartSheet}
              onSubscribe={handleStubSubscribe}
              onBuyRuns={handleStubBuyRuns}
            />
          )}

          <section>
            <h2 className="mb-3 text-[14px] font-[200] uppercase tracking-wide text-muted-foreground">
              История
            </h2>
            {jobsQuery.isPending ? (
              <p className="text-[13px] font-[200] text-muted-foreground">Загрузка…</p>
            ) : jobs.length === 0 ? (
              <p className="rounded-[28px] bg-card px-4 py-7 text-center text-[14px] font-[200] text-muted-foreground">
                Запусков пока не было
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {jobs.map((job) => (
                  <AiSearchHistoryRow key={job.id} job={job} onClick={() => openJobDetail(job)} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

    </div>
  )
}

export default AiSearchPage
