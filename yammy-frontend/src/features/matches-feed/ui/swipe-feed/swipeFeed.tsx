import { memo, useCallback, useRef } from 'react'

import { useSwipeFeed } from '@/features/matches-feed/hooks/useSwipeFeed'
import { cn } from '@/shared'

import type { UserSearchResult } from '@/entities/user/types/types'

import { useMatchesOverlay } from '../matches-card/matchesOverlay'
import { SwipeCard } from '../swipe-card'

export interface SwipeFeedProps {
  items: UserSearchResult[]
  onSwipeLeft?: (item: UserSearchResult) => void
  onSwipeRight?: (item: UserSearchResult) => void
  onSuperLike?: (item: UserSearchResult) => void
  onEmpty?: () => void
  /** Вызывается при приближении к концу ленты. Используйте для подгрузки новых элементов. */
  onNearEnd?: (remainingCount: number) => void
  /** За сколько карточек до конца вызывать onNearEnd. По умолчанию: 5 */
  nearEndThreshold?: number
  className?: string
  aspectRatio?: number
  fillHeight?: boolean
}

const SwipeFeedComponent = ({
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
}: SwipeFeedProps): React.JSX.Element => {
  const {
    visibleItems,
    // remainingCount,
    stackProgress,
    handleSwipeLeft,
    handleSwipeRight,
    handleSuperLike,
  } = useSwipeFeed({
    initialItems,
    onSwipeLeft,
    onSwipeRight,
    onSuperLike,
    onEmpty,
    onNearEnd,
    nearEndThreshold,
  })

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

  // if (remainingCount === 0) {
  //   return (
  //     <div
  //       className={cn(
  //         'flex items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground',
  //         fillHeight && 'h-full min-h-0',
  //         className,
  //       )}
  //       style={fillHeight ? undefined : { aspectRatio }}
  //     >
  //       <p className="text-center text-sm">Больше карточек нет</p>
  //     </div>
  //   )
  // }

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
}

export const SwipeFeed = memo(SwipeFeedComponent)
