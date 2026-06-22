import { useQueryClient } from '@tanstack/react-query'
import type { JSX } from 'react'
import { useCallback, useMemo, useRef } from 'react'

import { sendUserDislike, sendUserLike } from '@/entities/like/api/likeService'
import { flattenLikesPages, useReceivedLikes } from '@/entities/user/hooks/useReceivedLikes'
import { usersQueryKeys } from '@/entities/user/lib/usersQueryKeys'
import type { UserSearchApiUser } from '@/entities/user/types/types'
import { LikesCard, SuperLikeCard } from '@/features/likes-feed'
import { useMatchesOverlay } from '@/features/matches-feed/ui/matches-card/matchesOverlay'
import { useInfiniteScrollLoadMore } from '@/shared/hooks/useInfiniteScrollLoadMore'
import { formatUserErrorMessage } from '@/shared/lib/formatUserErrorMessage'
import { stickyTopHeaderClassNames } from '@/widgets'

import { LikesPageSkeleton } from './components/likesPageSkeleton'

const LikesPage = (): JSX.Element => {
  const queryClient = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const { openProfileDetails } = useMatchesOverlay()
  const likesQuery = useReceivedLikes()
  const items = flattenLikesPages(likesQuery.data)
  const superLikeItems = useMemo(
    () => items.filter((item) => item.like_type === 'superlike'),
    [items],
  )
  const regularLikeItems = useMemo(
    () => items.filter((item) => item.like_type !== 'superlike'),
    [items],
  )

  useInfiniteScrollLoadMore({
    scrollRootRef: scrollRef,
    sentinelRef: loadMoreRef,
    hasNextPage: likesQuery.hasNextPage,
    isFetchingNextPage: likesQuery.isFetchingNextPage,
    fetchNextPage: () => void likesQuery.fetchNextPage(),
  })

  const invalidateLikes = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...usersQueryKeys.all, 'received-likes'] })
  }, [queryClient])

  const handleLike = useCallback(
    (item: UserSearchApiUser) => {
      void sendUserLike(item.user_id)
        .then(invalidateLikes)
        .catch(() => {
          /* throwApiError уже показал тост */
        })
    },
    [invalidateLikes],
  )

  const handleDislike = useCallback(
    (item: UserSearchApiUser) => {
      void sendUserDislike(item.user_id)
        .then(invalidateLikes)
        .catch(() => {
          /* throwApiError уже показал тост */
        })
    },
    [invalidateLikes],
  )

  const handleOpenProfile = useCallback(
    (item: UserSearchApiUser) => {
      openProfileDetails({
        item,
        onLike: () => handleLike(item),
      })
    },
    [handleDislike, handleLike, openProfileDetails],
  )

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden overflow-x-hidden bg-background px-4 text-foreground">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-x-none no-scrollbar scroll-pb-[calc(5.25rem+2.25rem+3.5rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="flex flex-col gap-4 pb-[calc(5.25rem+2.25rem+3.5rem+env(safe-area-inset-bottom,0px))]">
          <header className={stickyTopHeaderClassNames()} aria-hidden />
          <div className="flex min-h-[calc(100dvh-10.375rem-env(safe-area-inset-bottom,0px))] flex-col">
            <h1 className="mb-4 text-[22px] font-bold uppercase leading-none tracking-tight text-white">
              Лайки
            </h1>
            {likesQuery.isPending ? (
              <LikesPageSkeleton />
            ) : likesQuery.isError ? (
              <div className="flex min-h-[min(420px,70vh)] flex-col items-center justify-center gap-3 text-center">
                <p className="text-[15px] font-medium text-muted-foreground">
                  {formatUserErrorMessage(likesQuery.error)}
                </p>
                <button
                  type="button"
                  onClick={() => void likesQuery.refetch()}
                  className="rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground"
                >
                  Повторить
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-[15px] font-medium text-muted-foreground">
                  Пока никто не лайкнул
                </p>
              </div>
            ) : (
              <>
                {superLikeItems.length > 0 && (
                  <section className="mb-6 flex flex-col gap-3">
                    <h2 className="text-[15px] font-bold uppercase leading-none tracking-tight text-white/80">
                      Огоньки
                    </h2>
                    <div className="flex flex-col gap-4">
                      {superLikeItems.map((item) => (
                        <SuperLikeCard
                          key={item.user_id}
                          item={item}
                          onClick={() => handleOpenProfile(item)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {regularLikeItems.length > 0 && (
                  <section className="flex flex-col gap-3">
                    {superLikeItems.length > 0 && (
                      <h2 className="text-[15px] font-bold uppercase leading-none tracking-tight text-white/80">
                        Лайки
                      </h2>
                    )}
                    <div className="grid grid-cols-2 gap-[15px]">
                      {regularLikeItems.map((item) => (
                        <LikesCard
                          key={item.user_id}
                          item={item}
                          onClick={() => handleOpenProfile(item)}
                        />
                      ))}
                    </div>
                  </section>
                )}
                <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center py-2">
                  {likesQuery.isFetchingNextPage && (
                    <p className="text-[13px] text-muted-foreground">Загрузка…</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LikesPage
