import { memo, useRef } from 'react'

import type { UserSearchResult } from '@/entities/user/types/types'
import { useSwipeFeed } from '@/features/matches-feed/hooks/useSwipeFeed'
import { cn } from '@/shared'

import { RateCard } from '../rate-card/rateCard'

export interface RateFeedProps {
  items: UserSearchResult[]
  onSwipeLeft?: (item: UserSearchResult) => void
  onSwipeRight?: (item: UserSearchResult) => void
  onRate?: (item: UserSearchResult, rating: number) => void
  onMessage?: (item: UserSearchResult) => void
  onEmpty?: () => void
  onNearEnd?: (remainingCount: number) => void
  nearEndThreshold?: number
  className?: string
  aspectRatio?: number
  fillHeight?: boolean
}

const RateFeedComponent = ({
  items: initialItems,
  onSwipeLeft,
  onSwipeRight,
  onRate,
  onMessage,
  onEmpty,
  onNearEnd,
  nearEndThreshold,
  className,
  aspectRatio = 3 / 4,
  fillHeight = false,
}: RateFeedProps): React.JSX.Element => {
  const { visibleItems, stackProgress, handleSwipeLeft, handleSwipeRight } = useSwipeFeed({
    initialItems,
    onSwipeLeft,
    onSwipeRight,
    onEmpty,
    onNearEnd,
    nearEndThreshold,
  })

  const topItemRef = useRef(visibleItems[0])
  topItemRef.current = visibleItems[0]

  return (
    <div
      className={cn('relative w-full overflow-visible', fillHeight && 'h-full min-h-0', className)}
      style={fillHeight ? undefined : { aspectRatio }}
    >
      {visibleItems.map((item, index) => (
        <RateCard
          key={item.user_id}
          photos={item.photos}
          name={item.name}
          age={item.age}
          city={item.city}
          isTop={index === 0}
          stackIndex={index}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          stackProgress={stackProgress}
          onRate={(rating) => {
            if (index === 0 && onRate) {
              onRate(item, rating)
              handleSwipeRight() // Proceed to next card on rate
            }
          }}
          onMessage={() => {
            if (index === 0 && onMessage) {
              onMessage(item)
            }
          }}
        />
      ))}
    </div>
  )
}

export const RateFeed = memo(RateFeedComponent)
