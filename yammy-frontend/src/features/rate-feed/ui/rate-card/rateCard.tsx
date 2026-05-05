import { motion, type MotionValue, useTransform } from 'framer-motion'
import { memo, useState } from 'react'

import { useSwipeCardDrag } from '@/features/matches-feed/hooks/useSwipeCardDrag'
import { useSwipeCardMotion } from '@/features/matches-feed/hooks/useSwipeCardMotion'
import { cn } from '@/shared'
import { ImageCarousel } from '@/shared/ui/image/imageCarousel'

import { RateCardActions } from './rateCardActions'

export interface RateCardProps {
  /** Массив URL фотографий для слайдера. */
  photos: string[]
  isTop: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onRate?: (rating: number) => void
  onMessage?: () => void
  name?: string
  age?: number
  city?: string
  className?: string
  stackIndex?: number
  stackProgress?: MotionValue<number>
}

const RateCardComponent = ({
  photos,
  isTop,
  onSwipeLeft,
  onSwipeRight,
  onRate,
  onMessage,
  name,
  age,
  city,
  className,
  stackIndex = 0,
  stackProgress,
}: RateCardProps): React.JSX.Element => {
  const { x, rotate, y, scale, progress } = useSwipeCardMotion({
    stackIndex,
    stackProgress,
  })

  const { handleDragEnd } = useSwipeCardDrag({
    x,
    progress,
    isTop,
    onSwipeLeft,
    onSwipeRight,
  })

  const [isDragging, setIsDragging] = useState(false)

  const bottomBlurOpacity = useTransform(x, [-50, -15, 0, 15, 50], [0, 1, 1, 1, 0])

  return (
    <motion.div
      className={cn(
        'absolute inset-0 touch-none select-none flex flex-col bg-background',
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
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-[48px] bg-transparent [backface-visibility:hidden] [transform:translateZ(0)]">
        <ImageCarousel
          enabledImageSwiping={true}
          images={
            photos
              ? [
                  '/images/photo_2025-12-23_22-41-09.jpg',
                  '/images/photo_2025-12-16_22-32-35.jpg',
                  '/images/photo_2025-04-10_00-42-15.jpg',
                  '/images/i.webp',
                ]
              : []
          }
          imageAlt={name ?? ''}
          blur={false}
          isTop={isTop}
        />

        {!isDragging && (
          <motion.div
            className="pointer-events-none absolute -left-[1px] -right-[1px] -bottom-[1px] z-0 h-[40%]"
            style={{
              opacity: bottomBlurOpacity,
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
            }}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col justify-end z-10 w-full">
          {(name != null || age != null || city != null) && (
            <div className="flex flex-col gap-1 text-white px-7">
              {city != null && (
                <span className="text-sm font-light leading-[120%] tracking-[0] opacity-90">
                  {city}
                </span>
              )}
              {(name != null || age != null) && (
                <span className="text-[28px] leading-[120%] tracking-[0] font-semibold">
                  {[name, age != null ? `${age}` : null].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {isTop && (
        <div className="shrink-0 pt-3 pb-1 z-20 w-full">
          <RateCardActions onRate={onRate} onMessage={onMessage} />
        </div>
      )}
    </motion.div>
  )
}

export const RateCard = memo(RateCardComponent)
