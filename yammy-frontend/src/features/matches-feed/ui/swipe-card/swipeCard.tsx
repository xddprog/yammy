import { motion, type MotionValue, useTransform } from 'framer-motion'
import { Heart, MapPin, X } from 'lucide-react'
import { memo, useState } from 'react'

import { useSuperLikeInteractions } from '@/features/matches-feed/hooks/useSuperLikeInteractions'
import { useSwipeCardDrag } from '@/features/matches-feed/hooks/useSwipeCardDrag'
import { useSwipeCardMotion } from '@/features/matches-feed/hooks/useSwipeCardMotion'
import { cn } from '@/shared'

import { ImageCarousel } from '../../../../shared/ui/image/imageCarousel'
import { SwipeCardActions } from './swipeCardActions'

export type SwipeDirection = 'left' | 'right'

export interface SwipeCardProps {
  /** Массив URL фотографий для слайдера. */
  photos: string[]
  isTop: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSuperLike?: () => void
  compatibility?: number
  name?: string
  age?: number
  city?: string
  className?: string
  stackIndex?: number
  stackProgress?: MotionValue<number>
  onOpenDetails?: () => void
}

const SwipeCardComponent = ({
  photos,
  isTop,
  onSwipeLeft,
  onSwipeRight,
  onSuperLike,
  compatibility,
  name,
  age,
  city,
  className,
  stackIndex = 0,
  stackProgress,
  onOpenDetails,
}: SwipeCardProps): React.JSX.Element => {
  const { x, rotate, y, scale, progress } = useSwipeCardMotion({
    stackIndex,
    stackProgress,
  })
  const { handleDragEnd, swipeLeft, swipeRight } = useSwipeCardDrag({
    x,
    progress,
    isTop,
    onSwipeLeft,
    onSwipeRight,
  })
  const superLike = useSuperLikeInteractions({
    onLike: swipeRight,
    onSuperLike,
  })
  const [_, setIsDragging] = useState(false)

  const likeOpacity = useTransform(x, [0, 80], [0, 1])
  const dislikeOpacity = useTransform(x, [-80, 0], [1, 0])

  const overlayOpacity = useTransform(
    progress,
    [-1, -0.8, -0.5, 0, 0.5, 0.8, 1],
    [1, 0.6, 0, 0, 0, 0.6, 1],
  )

  return (
    <motion.div
      className={cn(
        'absolute inset-0 touch-none select-none bg-transparent [backface-visibility:hidden] [transform:translateZ(0)]',
        className,
      )}
      style={{
        x,
        rotate,
        y,
        zIndex: 100 - stackIndex,
        scale,
        cursor: isTop ? 'grab' : 'default',
      }}
      drag={isTop ? 'x' : false}
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        handleDragEnd(event, info)
        setTimeout(() => setIsDragging(false), 450)
      }}
      initial={false}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2rem] [backface-visibility:hidden] [transform:translateZ(0)]">
        <ImageCarousel
          enabledImageSwiping={!superLike.isSuperLikeMode}
          images={photos.length < 0 ? photos : ['/images/test.jpg', '/images/test1.jpg', '/images/test2.jpg']}
          imageAlt={name ?? ''}
          blur={superLike.isSuperLikeMode}
          isTop={isTop}
        />

        {isTop && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[2rem]"
            style={{
              opacity: overlayOpacity,
              backgroundColor: '#140a30b0',
              backdropFilter: 'blur(4px)',
            }}
          />
        )}

        {isTop && (
          <>
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 flex h-[128px] w-[128px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ opacity: dislikeOpacity }}
            >
              <X
                size={128}
                className="text-white"
                strokeWidth={1.5}
              />
            </motion.div>

            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 flex h-[128px] w-[128px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ opacity: likeOpacity }}
            >
              <Heart
                size={128}
                className="text-accent"
                strokeWidth={1.5}
                fill="currentColor"
              />
            </motion.div>
          </>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-3 sm:bottom-4 flex flex-col justify-end z-10 w-full">
          {(name != null || age != null || city != null) && (
            <div
              className={cn('flex flex-col gap-1 text-white px-5 pb-4', superLike.isSuperLikeMode && 'blur-[2px]')}
            >
              {(name != null || age != null) && (
                <span className="text-[28px] font-medium leading-[120%] tracking-[0]">
                  {[name, age != null ? `${age}` : null].filter(Boolean).join(', ')}
                </span>
              )}
              {city != null && (
                <span className="flex items-center gap-1 text-[15px] font-thin leading-[120%] tracking-[0] text-white/85">
                  <MapPin size={17} strokeWidth={1.2} aria-hidden />
                  {city}
                </span>
              )}
            </div>
          )}

          <div className="w-full">
            <SwipeCardActions
              compatibility={compatibility}
              onDislike={swipeLeft}
              isSuperLikeMode={superLike.isSuperLikeMode}
              rootRef={superLike.rootRef}
              onLikePointerDown={superLike.handleLikePointerDown}
              onLikePointerUp={superLike.handleLikePointerUp}
              onLikePointerLeave={superLike.handleLikePointerLeave}
              onSuperLikeClick={superLike.handleSuperLikeClick}
              onOpenDetails={onOpenDetails}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export const SwipeCard = memo(SwipeCardComponent)
