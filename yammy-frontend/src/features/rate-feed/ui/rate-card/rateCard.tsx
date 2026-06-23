import { animate, motion, type MotionValue, useTransform } from 'framer-motion'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

import { useSwipeCardDrag } from '@/features/matches-feed/hooks/useSwipeCardDrag'
import { useSwipeCardMotion } from '@/features/matches-feed/hooks/useSwipeCardMotion'
import { cn, Image, useOverlay } from '@/shared'
import { ImageCarousel } from '@/shared/ui/image/imageCarousel'

import { RateCardActions } from './rateCardActions'

const RATE_CARD_TRANSITION_DURATION = 0.22
const RATE_CARD_TRANSITION_EASE = [0.22, 0.61, 0.36, 1] as const

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
  const [isExiting, setIsExiting] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const wasBehindRef = useRef(stackIndex > 0)
  const exitStartedRef = useRef(false)
  const { open } = useOverlay()

  const openImagesPreview = useCallback(
    (index: number) => {
      if (photos.length === 0 || isExiting) return
      open({
        backdropClassName: 'bg-black/85 backdrop-blur-0',
        panelClassName: '!h-full !w-full !max-w-none flex items-center justify-center p-4 pointer-events-none',
        content: () => (
          <div className="pointer-events-auto overflow-hidden rounded-[24px] bg-black">
            <Image
              src={photos[index]}
              alt={`${name ?? 'Фото'} ${index + 1}`}
              className="block h-auto max-h-[88vh] w-auto max-w-[92vw] object-contain"
            />
          </div>
        ),
      })
    },
    [isExiting, name, open, photos],
  )

  useEffect(() => {
    if (isTop && wasBehindRef.current) {
      wasBehindRef.current = false
      setIsEntering(true)
      const timer = window.setTimeout(() => setIsEntering(false), RATE_CARD_TRANSITION_DURATION * 1000)
      return () => window.clearTimeout(timer)
    }
    if (!isTop) {
      wasBehindRef.current = true
    }
    return undefined
  }, [isTop, stackIndex])

  const handleRate = useCallback(
    (rating: number) => {
      if (isExiting || !isTop) return
      exitStartedRef.current = true
      setIsExiting(true)
      onRate?.(rating)
      void animate(progress, 1, {
        duration: RATE_CARD_TRANSITION_DURATION,
        ease: RATE_CARD_TRANSITION_EASE,
      })
    },
    [isExiting, isTop, onRate, progress],
  )

  const handlePhotoAnimationComplete = useCallback(() => {
    if (!exitStartedRef.current) return
    exitStartedRef.current = false
    onSwipeRight?.()
  }, [onSwipeRight])

  const bottomBlurOpacity = useTransform(x, [-50, -15, 0, 15, 50], [0, 1, 1, 1, 0])

  const photoAnimate = isExiting
    ? { opacity: 0, scale: 0.94, y: -10 }
    : isEntering
      ? { opacity: 1, scale: 1, y: 0 }
      : { opacity: 1, scale: 1, y: 0 }

  const photoInitial = isEntering ? { opacity: 0.72, scale: 0.97, y: 12 } : false

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
        cursor: isTop && !isExiting ? 'grab' : 'default',
      }}
      drag={isTop && !isExiting ? 'x' : false}
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
      <motion.div
        className="min-h-0 flex-1"
        initial={photoInitial}
        animate={photoAnimate}
        transition={{ duration: RATE_CARD_TRANSITION_DURATION, ease: RATE_CARD_TRANSITION_EASE }}
        onAnimationComplete={isExiting ? handlePhotoAnimationComplete : undefined}
      >
        <div className="relative h-full min-h-0 overflow-hidden rounded-[48px] bg-card shadow-lg">
          <ImageCarousel
            enabledImageSwiping={!isExiting}
            images={photos}
            imageAlt={name ?? ''}
            blur={false}
            isTop={isTop}
            onImageTap={isTop && !isExiting ? openImagesPreview : undefined}
          />

          {!isDragging && (
            <motion.div
              className="pointer-events-none absolute -inset-x-px -bottom-px z-0 h-[55%] bg-gradient-to-t from-black/80 via-black/40 to-transparent"
              style={{ opacity: bottomBlurOpacity }}
            />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex w-full flex-col justify-end">
            {(name != null || age != null || city != null) && (
              <div className="flex flex-col gap-1 px-7 text-white">
                {city != null && (
                  <span className="text-sm font-light leading-[120%] tracking-[0] opacity-90">
                    {city}
                  </span>
                )}
                {(name != null || age != null) && (
                  <span className="text-[28px] font-semibold leading-[120%] tracking-[0]">
                    {[name, age != null ? `${age}` : null].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {isTop && (
        <div className="z-20 w-full shrink-0 pb-1 pt-3">
          <RateCardActions onRate={handleRate} disabled={isExiting} />
        </div>
      )}
    </motion.div>
  )
}

export const RateCard = memo(RateCardComponent)
