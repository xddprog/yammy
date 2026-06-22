import { useQueryClient } from '@tanstack/react-query'
import type { JSX } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { sendAppearanceRating } from '@/entities/user/api/appearanceRatingService'
import { sendUserLike } from '@/entities/like/api/likeService'
import {
  flattenAppearanceRatingsPages,
  useReceivedAppearanceRatings,
} from '@/entities/user/hooks/useReceivedAppearanceRatings'
import { flattenLikesPages, useReceivedLikes } from '@/entities/user/hooks/useReceivedLikes'
import { usersQueryKeys } from '@/entities/user/lib/usersQueryKeys'
import type { AppearanceRatingReceivedItem, UserSearchApiUser } from '@/entities/user/types/types'
import { LikesCard, SuperLikeCard } from '@/features/likes-feed'
import { useMatchesOverlay } from '@/features/matches-feed/ui/matches-card/matchesOverlay'
import { useInfiniteScrollLoadMore } from '@/shared/hooks/useInfiniteScrollLoadMore'
import { formatUserErrorMessage } from '@/shared/lib/formatUserErrorMessage'
import { cn } from '@/shared'
import { stickyTopHeaderClassNames } from '@/widgets'

import { LikesPageSkeleton } from './components/likesPageSkeleton'

type LikesPageTab = 'likes' | 'ratings'

const LikesPage = (): JSX.Element => {
  const queryClient = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<LikesPageTab>('likes')
  const { openProfileDetails } = useMatchesOverlay()
  const likesQuery = useReceivedLikes(undefined, { enabled: tab === 'likes' })
  const ratingsQuery = useReceivedAppearanceRatings(undefined, { enabled: tab === 'ratings' })
  const likeItems = flattenLikesPages(likesQuery.data)
  const ratingItems = flattenAppearanceRatingsPages(ratingsQuery.data)
  const superLikeItems = useMemo(
    () => likeItems.filter((item) => item.like_type === 'superlike'),
    [likeItems],
  )
  const regularLikeItems = useMemo(
    () => likeItems.filter((item) => item.like_type !== 'superlike'),
    [likeItems],
  )

  const activeQuery = tab === 'likes' ? likesQuery : ratingsQuery

  useInfiniteScrollLoadMore({
    scrollRootRef: scrollRef,
    sentinelRef: loadMoreRef,
    hasNextPage: activeQuery.hasNextPage,
    isFetchingNextPage: activeQuery.isFetchingNextPage,
    fetchNextPage: () => void activeQuery.fetchNextPage(),
  })

  const invalidateLikes = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...usersQueryKeys.all, 'received-likes'] })
  }, [queryClient])

  const invalidateRatings = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [...usersQueryKeys.all, 'received-appearance-ratings'],
    })
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

  const handleOpenLikeProfile = useCallback(
    (item: UserSearchApiUser) => {
      openProfileDetails({
        item,
        onLike: () => handleLike(item),
      })
    },
    [handleLike, openProfileDetails],
  )

  const handleOpenRatingProfile = useCallback(
    (item: AppearanceRatingReceivedItem) => {
      openProfileDetails({
        item,
        fromRatings: true,
        receivedScore: item.score,
        myScore: item.my_score,
        onRate: (score) => {
          void sendAppearanceRating(item.user_id, score)
            .then(invalidateRatings)
            .catch(() => {
              /* throwApiError уже показал тост */
            })
        },
      })
    },
    [invalidateRatings, openProfileDetails],
  )

  const renderLikesContent = () => {
    if (likesQuery.isLoading) {
      return <LikesPageSkeleton />
    }
    if (likesQuery.isError) {
      return (
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
      )
    }
    if (likeItems.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[15px] font-medium text-muted-foreground">Пока никто не лайкнул</p>
        </div>
      )
    }

    return (
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
                  onClick={() => handleOpenLikeProfile(item)}
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
                  onClick={() => handleOpenLikeProfile(item)}
                />
              ))}
            </div>
          </section>
        )}
      </>
    )
  }

  const renderRatingsContent = () => {
    if (ratingsQuery.isLoading) {
      return <LikesPageSkeleton />
    }
    if (ratingsQuery.isError) {
      return (
        <div className="flex min-h-[min(420px,70vh)] flex-col items-center justify-center gap-3 text-center">
          <p className="text-[15px] font-medium text-muted-foreground">
            {formatUserErrorMessage(ratingsQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => void ratingsQuery.refetch()}
            className="rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground"
          >
            Повторить
          </button>
        </div>
      )
    }
    if (ratingItems.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[15px] font-medium text-muted-foreground">Пока никто не оценил</p>
        </div>
      )
    }

    return (
      <section className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-[15px]">
          {ratingItems.map((item) => (
            <LikesCard
              key={item.user_id}
              item={item}
              mode="ratings"
              score={item.score}
              onClick={() => handleOpenRatingProfile(item)}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden overflow-x-hidden bg-background px-4 text-foreground">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-x-none no-scrollbar scroll-pb-[calc(5.25rem+2.25rem+3.5rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="flex flex-col gap-4 pb-[calc(5.25rem+2.25rem+3.5rem+env(safe-area-inset-bottom,0px))]">
          <header className={stickyTopHeaderClassNames()} aria-hidden />
          <div className="flex min-h-[calc(100dvh-10.375rem-env(safe-area-inset-bottom,0px))] flex-col">
            <div className="mb-4 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setTab('likes')}
                className={cn(
                  'text-[22px] font-bold uppercase leading-none tracking-tight transition-colors',
                  tab === 'likes' ? 'text-white' : 'text-white/50',
                )}
              >
                Лайки
              </button>
              <button
                type="button"
                onClick={() => setTab('ratings')}
                className={cn(
                  'text-[22px] font-bold uppercase leading-none tracking-tight transition-colors',
                  tab === 'ratings' ? 'text-white' : 'text-white/50',
                )}
              >
                Оценки
              </button>
            </div>
            {tab === 'likes' ? renderLikesContent() : renderRatingsContent()}
            <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center py-2">
              {activeQuery.isFetchingNextPage && (
                <p className="text-[13px] text-muted-foreground">Загрузка…</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LikesPage
