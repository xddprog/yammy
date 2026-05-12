import { memo, useCallback, useImperativeHandle, useRef, forwardRef } from 'react'

import { useSwipeFeed } from '@/features/matches-feed/hooks/useSwipeFeed'
import type { MatchFeedAppendHandle } from '@/features/matches-feed/model/matchFeedAppendHandle'
import { cn } from '@/shared'

import type { UserSearchApiUser } from '@/entities/user/types/types'

import { useMatchesOverlay } from '../matches-card/matchesOverlay'
import { SwipeCard } from '../swipe-card'

export interface SwipeFeedProps {
  items: UserSearchApiUser[]
  onSwipeLeft?: (item: UserSearchApiUser) => void
  onSwipeRight?: (item: UserSearchApiUser) => void
  onSuperLike?: (item: UserSearchApiUser) => void
  onEmpty?: () => void
  /** Вызывается при приближении к концу ленты. Используйте для подгрузки новых элементов. */
  onNearEnd?: (remainingCount: number) => void
  /** За сколько карточек до конца вызывать onNearEnd. По умолчанию: 5 */
  nearEndThreshold?: number
  className?: string
  aspectRatio?: number
  fillHeight?: boolean
}

const SwipeFeedComponent = forwardRef<MatchFeedAppendHandle, SwipeFeedProps>(function SwipeFeed(
  {
    items: initialItems,
    onSwipeLeft,
    onSwipeRight,
    onSuperLike,
    onEmpty,
    onNearEnd,
    nearEndThreshold,
    className,
    aspectRatio = 3 / 4,
    fillHeight = false,
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

  const handleOpenDetails = useCallback(() => {
    const item = topItemRef.current
    if (item == null) return

    openProfileDetails({
      item,
      onDislike: handleSwipeLeft,
      onLike: handleSwipeRight,
      onSuperLike: (closeParent) => {
        openSuperLikeOverlay({
          onSend: () => {
            handleSuperLike()
          },
          closeAlso: closeParent,
        })
      },
    })
  }, [openProfileDetails, openSuperLikeOverlay, handleSwipeLeft, handleSwipeRight, handleSuperLike])

  const handleSuperLikeClick = useCallback(() => {
    if (topItemRef.current == null) return
    openSuperLikeOverlay({
      onSend: () => {
        handleSuperLike()
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
