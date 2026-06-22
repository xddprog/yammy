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
          enabledImageSwiping={true}
          images={photos}
          imageAlt={name ?? ''}
          blur={false}
          isTop={isTop}
        />

        {!isDragging && (
          <motion.div
            className="pointer-events-none absolute -inset-x-px -bottom-px z-0 h-[45%] bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            style={{ opacity: bottomBlurOpacity }}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-6 sm:bottom-8 flex flex-col justify-end z-10 w-full">
          {(name != null || age != null || city != null) && (
            <div className="flex flex-col gap-2 text-white px-7 pb-4">
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

          {isTop && (
            <div className="w-full">
              <RateCardActions onRate={onRate} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export const RateCard = memo(RateCardComponent)
