import { motion, type MotionValue, useTransform } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import { memo, useState } from 'react'

import { useSuperLikeInteractions } from '@/features/matches-feed/hooks/useSuperLikeInteractions'
import { useSwipeCardDrag } from '@/features/matches-feed/hooks/useSwipeCardDrag'
import { useSwipeCardMotion } from '@/features/matches-feed/hooks/useSwipeCardMotion'
import { cn } from '@/shared'

import { ImageCarousel } from '../../../../shared/ui/image/imageCarousel'
import { SwipeCardActions } from './swipeCardActions'

const MOCK_FEED_PHOTOS = [
  '/images/photo_2025-12-23_22-41-09.jpg',
  '/images/photo_2025-12-16_22-32-35.jpg',
  '/images/photo_2025-04-10_00-42-15.jpg',
]

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
  /** Открытие детальной карточки профиля из стека свайпов. */
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
  const feedPhotos = photos.filter(Boolean)
  const carouselImages = feedPhotos.length < 0 ? feedPhotos : MOCK_FEED_PHOTOS

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

  const [isDragging, setIsDragging] = useState(false)

  const likeOpacity = useTransform(x, [0, 80], [0, 1])
  const dislikeOpacity = useTransform(x, [-80, 0], [1, 0])

  const bottomBlurOpacity = useTransform(x, [-50, -15, 0, 15, 50], [0, 1, 1, 1, 0])

  const overlayOpacity = useTransform(
    progress,
    [-1, -0.8, -0.5, 0, 0.5, 0.8, 1],
    [1, 0.6, 0, 0, 0, 0.6, 1],
  )

  return (
    <motion.div
      className={cn(
        'absolute inset-0 touch-none select-none overflow-hidden rounded-[48px] bg-card',
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
      onDragEnd={(e, info) => {
        handleDragEnd(e, info)
        setTimeout(() => setIsDragging(false), 450)
      }}
      initial={false}
    >
      <div className="relative h-full w-full">
        <ImageCarousel
          enabledImageSwiping={!superLike.isSuperLikeMode}
          images={carouselImages}
          imageAlt={name ?? ''}
          blur={superLike.isSuperLikeMode}
          isTop={isTop}
        />

        {isTop && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[48px]"
            style={{
              opacity: overlayOpacity,
              backgroundColor: '#14141440',
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
              <X size={128} className="text-white" strokeWidth={1.3} />
            </motion.div>

            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 flex h-[128px] w-[128px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ opacity: likeOpacity }}
            >
              <Heart size={128} className="text-white" strokeWidth={1.3} fill="white" />
            </motion.div>
          </>
        )}

        {!isDragging && (
          <motion.div
            className="pointer-events-none absolute -inset-x-1 -bottom-1 z-0 h-[calc(25%+40px)] rounded-b-[48px]"
            style={{
              opacity: bottomBlurOpacity,
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              maskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 100%)',
            }}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-6 sm:bottom-8 flex flex-col justify-end z-10 w-full">
          {(name != null || age != null || city != null) && (
            <div
              className={cn(
                'flex flex-col gap-2 text-white px-7 pb-4',
                superLike.isSuperLikeMode && 'blur-[2px]',
              )}
            >
              {city != null && (
                <span className="text-base font-light leading-[120%] tracking-[0]">{city}</span>
              )}
              {(name != null || age != null) && (
                <span
                  className="text-[32px] leading-[120%] tracking-[0]"
                  style={{ fontWeight: 566 }}
                >
                  {[name, age != null ? `${age}` : null].filter(Boolean).join(', ')}
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
