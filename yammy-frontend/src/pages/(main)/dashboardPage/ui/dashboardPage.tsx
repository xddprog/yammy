import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AppPageLoader } from '@/app/ui/AppPageLoader'
import { sendUserDislike, sendUserLike, sendUserSuperLike } from '@/entities/like/api/likeService'
import { sendAppearanceRating } from '@/entities/user/api/appearanceRatingService'
import { useAppearanceRatingUsers } from '@/entities/user/hooks/useAppearanceRatingUsers'
import { useUsersSearch } from '@/entities/user/hooks/useUsersSearch'
import { usersQueryKeys } from '@/entities/user/lib/usersQueryKeys'
import type {
  AppearanceRatingUserDto,
  FeedStackCardUser,
  UserSearchApiUser,
} from '@/entities/user/types/types'
import { RateFeed, SwipeFeed } from '@/features'
import type { MatchFeedAppendHandle } from '@/features/matches-feed/model/matchFeedAppendHandle'
import { useFiltersSearchParams } from '@/features/matches-filter/model/useFiltersSearchParams'
import { ProfileFillPromptBanner, useProfileFillPrompt } from '@/features/profile-fill-prompt'
import { showErrorToast } from '@/shared'
import { cn } from '@/shared'
import { ERouteNames } from '@/shared/lib/routeVariables'
import { appScreenTopInsetClassNames, Header } from '@/widgets'

const FEED_EMPTY_MESSAGE = 'Анкеты закончились, попробуйте поменять фильтры'

const EMPTY_SWIPE_USERS: UserSearchApiUser[] = []

const dashboardColumnClassName = cn(
  'flex h-full min-h-0 flex-col px-4',
  appScreenTopInsetClassNames,
  'pb-[calc(5.25rem+2.25rem+env(safe-area-inset-bottom,0px))]',
)

const emptyStateClassName = cn(
  'flex h-full min-h-0 flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground',
)

const DashboardPage = (): JSX.Element => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'swipe'
  const isSwipeMode = mode !== 'rate'
  const { visible: showFillPrompt, dismissForToday, notifyAfterSwipe } = useProfileFillPrompt()

  const filterParams = useFiltersSearchParams()
  const filterKey = useMemo(() => JSON.stringify(filterParams), [filterParams])
  const feedResetKey = isSwipeMode ? filterKey : 'appearance'
  const feedSessionKey = isSwipeMode ? `swipe:${feedResetKey}` : `rate:${feedResetKey}`

  const swipeSearch = useUsersSearch(filterParams, { enabled: isSwipeMode })
  const appearanceSearch = useAppearanceRatingUsers({ enabled: !isSwipeMode })

  const swipeUsers = swipeSearch.data ?? EMPTY_SWIPE_USERS
  const rateUsers = appearanceSearch.data ?? []
  const refetchSwipeSearch = swipeSearch.refetch
  const refetchAppearanceSearch = appearanceSearch.refetch

  const isSuccess = isSwipeMode ? swipeSearch.isSuccess : appearanceSearch.isSuccess

  const hasCards = isSwipeMode ? swipeUsers.length > 0 : rateUsers.length > 0

  const refetchFeed = useCallback(async () => {
    if (isSwipeMode) {
      return refetchSwipeSearch()
    }
    return refetchAppearanceSearch()
  }, [isSwipeMode, refetchSwipeSearch, refetchAppearanceSearch])

  const feedRef = useRef<MatchFeedAppendHandle | null>(null)
  const [feedFullyEnded, setFeedFullyEnded] = useState(false)
  const [feedMoreLoading, setFeedMoreLoading] = useState(false)
  const emptyRefetchInFlight = useRef(false)

  useEffect(() => {
    setFeedFullyEnded(false)
  }, [feedResetKey])

  const onLike = useCallback(
    (item: FeedStackCardUser) => {
      notifyAfterSwipe()
      void sendUserLike(item.user_id)
        .then((message) => {
          if (message) showErrorToast(message)
        })
        .catch(() => {
          /* throwApiError уже показал тост */
        })
    },
    [notifyAfterSwipe],
  )

  const onDislike = useCallback(
    (item: FeedStackCardUser) => {
      notifyAfterSwipe()
      void sendUserDislike(item.user_id).catch(() => {
        /* throwApiError уже показал тост */
      })
    },
    [notifyAfterSwipe],
  )

  const onSuperLike = useCallback(
    (item: FeedStackCardUser, message: string) => {
      notifyAfterSwipe()
      void sendUserSuperLike(item.user_id, message)
        .then((matchMessage) => {
          void queryClient.invalidateQueries({ queryKey: usersQueryKeys.profile() })
          if (matchMessage) showErrorToast(matchMessage)
        })
        .catch(() => {
          /* throwApiError уже показал тост */
        })
    },
    [notifyAfterSwipe, queryClient],
  )

  const handleFeedEmpty = useCallback(async () => {
    if (emptyRefetchInFlight.current) return
    emptyRefetchInFlight.current = true
    setFeedMoreLoading(true)
    setFeedFullyEnded(false)
    try {
      const { data } = await refetchFeed()
      const batch: UserSearchApiUser[] | AppearanceRatingUserDto[] = isSwipeMode
        ? ((data ?? []) as UserSearchApiUser[])
        : ((data ?? []) as AppearanceRatingUserDto[])
      if (batch.length === 0) {
        setFeedFullyEnded(true)
        return
      }
      const added = feedRef.current?.appendItems(batch) ?? 0
      if (added === 0) {
        setFeedFullyEnded(true)
      }
    } finally {
      setFeedMoreLoading(false)
      emptyRefetchInFlight.current = false
    }
  }, [refetchFeed, isSwipeMode])

  if (!isSuccess) {
    return (
      <div className={dashboardColumnClassName}>
        <Header />
        <div className="isolate min-h-0 flex-1 overflow-x-hidden">
          <AppPageLoader className="bg-transparent" />
        </div>
      </div>
    )
  }

  if (!hasCards) {
    return (
      <div className={dashboardColumnClassName}>
        <Header />
        <div className="relative isolate min-h-0 flex-1 overflow-x-hidden">
          <div className={emptyStateClassName}>{FEED_EMPTY_MESSAGE}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={dashboardColumnClassName}>
      <Header />
      <div className="relative isolate min-h-0 flex-1 overflow-x-hidden pb-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${mode}-${feedResetKey}`}
            className="h-full min-h-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {mode === 'rate' ? (
              <RateFeed
                ref={feedRef}
                items={rateUsers}
                sessionKey={feedSessionKey}
                fillHeight
                onSwipeLeft={onDislike}
                onRate={(item, rating) => {
                  void sendAppearanceRating(item.user_id, rating).catch(() => {
                    /* throwApiError уже показал тост */
                  })
                }}
                onMessage={(item) => console.log('Сообщение', item.user_id)}
                onEmpty={handleFeedEmpty}
              />
            ) : (
              <SwipeFeed
                ref={feedRef}
                items={swipeUsers}
                sessionKey={feedSessionKey}
                fillHeight
                onSwipeLeft={onDislike}
                onSwipeRight={onLike}
                onSuperLike={onSuperLike}
                onEmpty={handleFeedEmpty}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {feedMoreLoading && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-5 top-0 z-20 flex items-center justify-center rounded-[48px]"
            aria-busy
            aria-label="Подгрузка анкет"
          >
            <div className="h-full max-h-[min(520px,70dvh)] w-full min-h-0 px-2">
              <AppPageLoader className="bg-transparent" />
            </div>
          </div>
        )}

        {feedFullyEnded && !feedMoreLoading && (
          <div
            className={cn(
              'absolute inset-x-0 bottom-5 top-0 z-20 flex items-center justify-center rounded-[48px] bg-background/90 px-6',
            )}
          >
            <p className="max-w-[280px] text-center text-sm text-muted-foreground">
              {FEED_EMPTY_MESSAGE}
            </p>
          </div>
        )}
      </div>

      <ProfileFillPromptBanner
        open={isSwipeMode && showFillPrompt}
        onDismiss={dismissForToday}
        onFill={() => {
          dismissForToday()
          navigate(`/${ERouteNames.PROFILE_ROUTE}`, { state: { openEdit: true } })
        }}
      />
    </div>
  )
}

export default DashboardPage
