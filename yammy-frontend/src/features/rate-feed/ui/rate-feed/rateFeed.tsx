import { memo, useRef, forwardRef, useImperativeHandle } from 'react'

import type { AppearanceRatingUserDto } from '@/entities/user/types/types'
import { useSwipeFeed } from '@/features/matches-feed/hooks/useSwipeFeed'
import type { MatchFeedAppendHandle } from '@/features/matches-feed/model/matchFeedAppendHandle'
import { cn } from '@/shared'

import { RateCard } from '../rate-card/rateCard'

export interface RateFeedProps {
  items: AppearanceRatingUserDto[]
  onSwipeLeft?: (item: AppearanceRatingUserDto) => void
  onSwipeRight?: (item: AppearanceRatingUserDto) => void
  onRate?: (item: AppearanceRatingUserDto, rating: number) => void
  onEmpty?: () => void
  onNearEnd?: (remainingCount: number) => void
  nearEndThreshold?: number
  className?: string
  aspectRatio?: number
  fillHeight?: boolean
}

const RateFeedComponent = forwardRef<MatchFeedAppendHandle, RateFeedProps>(function RateFeed(
  {
    items: initialItems,
    onSwipeLeft,
    onSwipeRight,
    onRate,
    onEmpty,
    onNearEnd,
    nearEndThreshold,
    className,
    aspectRatio = 3 / 4,
    fillHeight = false,
  },
  ref,
): React.JSX.Element {
  const { visibleItems, stackProgress, handleSwipeLeft, handleSwipeRight, appendItems } =
    useSwipeFeed<AppearanceRatingUserDto>({
    initialItems,
    onSwipeLeft,
    onSwipeRight,
    onEmpty,
    onNearEnd,
    nearEndThreshold,
  })

  useImperativeHandle(ref, () => ({ appendItems }), [appendItems])

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
            if (index === 0) {
              onRate?.(item, rating)
            }
          }}
        />
      ))}
    </div>
  )
})

RateFeedComponent.displayName = 'RateFeed'

export const RateFeed = memo(RateFeedComponent)
