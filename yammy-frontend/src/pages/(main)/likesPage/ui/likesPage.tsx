import type { JSX } from 'react'
import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { sendUserDislike, sendUserLike } from '@/entities/like/api/likeService'
import { useReceivedLikes } from '@/entities/user/hooks/useReceivedLikes'
import { usersQueryKeys } from '@/entities/user/lib/usersQueryKeys'
import type { UserSearchApiUser } from '@/entities/user/types/types'
import { LikesCard } from '@/features/likes-feed'
import { FeedLoading } from '@/features/matches-feed/ui/feed-loading'
import { useMatchesOverlay } from '@/features/matches-feed/ui/matches-card/matchesOverlay'
import { formatUserErrorMessage } from '@/shared/lib/formatUserErrorMessage'

import { stickyTopHeaderClassNames } from '@/widgets'

const LikesPage = (): JSX.Element => {
  const queryClient = useQueryClient()
  const { openProfileDetails } = useMatchesOverlay()
  const likesQuery = useReceivedLikes()

  const invalidateLikes = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: usersQueryKeys.receivedLikes() })
  }, [queryClient])

  const handleLike = useCallback(
    (item: UserSearchApiUser) => {
      void sendUserLike(item.user_id).then(invalidateLikes).catch(() => {
        /* throwApiError уже показал тост */
      })
    },
    [invalidateLikes],
  )

  const handleDislike = useCallback(
    (item: UserSearchApiUser) => {
      void sendUserDislike(item.user_id).then(invalidateLikes).catch(() => {
        /* throwApiError уже показал тост */
      })
    },
    [invalidateLikes],
  )

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden overflow-x-hidden bg-background px-4 text-foreground">
      <div className="min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-x-none no-scrollbar scroll-pb-[calc(5.25rem+2.25rem+3.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex flex-col gap-4 pb-[calc(5.25rem+2.25rem+3.5rem+env(safe-area-inset-bottom,0px))]">
          <header
            className={stickyTopHeaderClassNames({ variant: 'background' })}
            aria-hidden
          />
          <div>
            <h1 className="mb-4 text-[22px] font-bold uppercase leading-none tracking-tight text-white">
              Лайки
            </h1>
            {likesQuery.isPending ? (
              <div className="flex min-h-[min(420px,70vh)] items-center justify-center">
                <FeedLoading />
              </div>
            ) : likesQuery.isError ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
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
            ) : (likesQuery.data?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-[15px] font-medium text-muted-foreground">Пока никто не лайкнул</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-[15px]">
                {likesQuery.data!.map((item) => (
                  <LikesCard
                    key={item.user_id}
                    item={item}
                    onClick={() =>
                      openProfileDetails({
                        item,
                        onLike: () => handleLike(item),
                        onDislike: () => handleDislike(item),
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LikesPage
