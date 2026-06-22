import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef } from 'react'

import type { UserSearchApiUser } from '@/entities/user/types/types'
import { useSwipeFeed } from '@/features/matches-feed/hooks/useSwipeFeed'
import type { MatchFeedAppendHandle } from '@/features/matches-feed/model/matchFeedAppendHandle'
import { cn } from '@/shared'

import { useMatchesOverlay } from '../matches-card/matchesOverlay'
import { SwipeCard } from '../swipe-card'

export interface SwipeFeedProps {
  items: UserSearchApiUser[]
  /** Восстановление позиции ленты при возврате на экран. */
  sessionKey?: string
  onSwipeLeft?: (item: UserSearchApiUser) => void
  onSwipeRight?: (item: UserSearchApiUser) => void
  onSuperLike?: (item: UserSearchApiUser, message: string) => void
  onEmpty?: () => void
  /** Вызывается при приближении к концу ленты. Используйте для подгрузки новых элементов. */
  onNearEnd?: (remainingCount: number) => void
  /** За сколько карточек до конца вызывать onNearEnd. По умолчанию: 5 */
  nearEndThreshold?: number
  className?: string
  aspectRatio?: number
  fillHeight?: boolean
  /** Верхняя карточка в стеке сменилась (для AI highlight и т.п.). */
  onTopUserChange?: (userId: string | null) => void
}

const SwipeFeedComponent = forwardRef<MatchFeedAppendHandle, SwipeFeedProps>(function SwipeFeed(
  {
    items: initialItems,
    sessionKey,
    onSwipeLeft,
    onSwipeRight,
    onSuperLike,
    onEmpty,
    onNearEnd,
    nearEndThreshold,
    className,
    aspectRatio = 3 / 4,
    fillHeight = false,
    onTopUserChange,
  },
  ref,
): React.JSX.Element {
  const {
    visibleItems,
    stackProgress,
    handleSwipeLeft,
    handleSwipeRight,
    handleSuperLike,
    appendItems,
  } = useSwipeFeed<UserSearchApiUser>({
    initialItems,
    sessionKey,
    onSwipeLeft,
    onSwipeRight,
    onSuperLike,
    onEmpty,
    onNearEnd,
    nearEndThreshold,
  })

  useImperativeHandle(ref, () => ({ appendItems }), [appendItems])

  const { openProfileDetails, openSuperLikeOverlay } = useMatchesOverlay()

  const topItemRef = useRef(visibleItems[0])
  topItemRef.current = visibleItems[0]

  const topUserId = visibleItems[0]?.user_id ?? null
  useEffect(() => {
    onTopUserChange?.(topUserId)
  }, [onTopUserChange, topUserId])

  const handleOpenDetails = useCallback(() => {
    const item = topItemRef.current
    if (item == null) return

    openProfileDetails({
      item,
      onLike: handleSwipeRight,
      onSuperLike: (closeParent) => {
        openSuperLikeOverlay({
          onSend: (message) => {
            handleSuperLike(message)
          },
          closeAlso: closeParent,
        })
      },
    })
  }, [openProfileDetails, openSuperLikeOverlay, handleSwipeLeft, handleSwipeRight, handleSuperLike])

  const handleSuperLikeClick = useCallback(() => {
    if (topItemRef.current == null) return
    openSuperLikeOverlay({
      onSend: (message) => {
        handleSuperLike(message)
      },
    })
  }, [openSuperLikeOverlay, handleSuperLike])

  return (
    <div
      className={cn('relative w-full overflow-visible', fillHeight && 'h-full min-h-0', className)}
      style={fillHeight ? undefined : { aspectRatio }}
    >
      {visibleItems.map((item, index) => (
        <SwipeCard
          key={item.user_id}
          photos={item.photos}
          compatibility={item.match_percentage}
          name={item.name}
          age={item.age}
          city={item.city}
          isTop={index === 0}
          stackIndex={index}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onSuperLike={index === 0 ? handleSuperLikeClick : undefined}
          stackProgress={stackProgress}
          onOpenDetails={index === 0 ? handleOpenDetails : undefined}
        />
      ))}
    </div>
  )
})

SwipeFeedComponent.displayName = 'SwipeFeed'

export const SwipeFeed = memo(SwipeFeedComponent)
