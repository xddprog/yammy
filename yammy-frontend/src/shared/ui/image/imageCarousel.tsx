import { motion } from 'framer-motion'
import React, { memo, useEffect, useMemo } from 'react'

import { Image } from '@/shared'
import { cn } from '@/shared'
import { useCarouselStrip } from '@/shared/hooks/useCarouselStrip'
import { useCarouselZones } from '@/shared/hooks/useCarouselZones'
import { useImageCarousel } from '@/shared/hooks/useImageCarousel'

const ANIMATION_DURATION = 0.25
const ANIMATION_EASE = 'easeInOut'

export interface ImageCarouselProps {
  /** Массив URL изображений. Для высокой нагрузки (много карточек) предпочтительно стабильная ссылка (useMemo). */
  images: string[]
  imageAlt?: string
  className?: string
  blur?: boolean
  isTop?: boolean
  enabledImageSwiping?: boolean
  /** Вызывается при смене слайда. Рекомендуется мемоизировать (useCallback) при высокой нагрузке. */
  onImageChange?: (index: number) => void
  showIndicators?: boolean
  /** Расположение индикаторов: сверху (по умолчанию) или снизу. */
  align?: 'top' | 'bottom'
}

const CarouselIndicators = memo(function CarouselIndicators({
  currentIndex,
  totalImages,
}: {
  currentIndex: number
  totalImages: number
}) {
  if (totalImages <= 1) return null

  return (
    <div className="flex w-full gap-1">
      {Array.from({ length: totalImages }, (_, index) => (
        <div
          key={index}
          className={cn(
            'h-1 min-w-0 rounded-full transition-all duration-200',
            index === currentIndex ? 'bg-accent flex-[2]' : 'bg-secondary/80 flex-1',
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
})

const CarouselStrip = memo(function CarouselStrip({
  stripSlides,
  totalPositions,
  effectivePosition,
  isResettingFromClone,
  onAnimationComplete,
  imageAlt,
  blur,
}: {
  stripSlides: string[]
  totalPositions: number
  effectivePosition: number
  isResettingFromClone: boolean
  onAnimationComplete: () => void
  imageAlt: string
  blur: boolean
}) {
  const containerStyle = useMemo(() => ({ width: `${totalPositions * 100}%` }), [totalPositions])
  const slideStyle = useMemo(() => ({ width: `${100 / totalPositions}%` }), [totalPositions])
  const animateX = useMemo(
    () => `${-(effectivePosition * 100) / totalPositions}%`,
    [effectivePosition, totalPositions],
  )

  return (
    <motion.div
      className="flex h-full"
      style={containerStyle}
      initial={false}
      animate={{ x: animateX }}
      transition={{
        type: 'tween',
        duration: isResettingFromClone ? 0 : ANIMATION_DURATION,
        ease: ANIMATION_EASE,
      }}
      onAnimationComplete={onAnimationComplete}
    >
      {stripSlides.map((src, index) => (
        <div key={index} className="flex-shrink-0" style={slideStyle}>
          <Image
            src={src}
            alt={`${imageAlt} ${index + 1}`}
            className={cn('h-full w-full object-cover', blur && 'blur-[2px]')}
            loading="eager"
          />
        </div>
      ))}
    </motion.div>
  )
})

const ImageCarouselComponent = ({
  images,
  imageAlt = '',
  className,
  blur = false,
  isTop = false,
  onImageChange,
  showIndicators = true,
  enabledImageSwiping = true,
  align = 'top',
}: ImageCarouselProps): React.JSX.Element => {
  const { currentIndex, goNext, goPrevious, goToIndex, totalImages } = useImageCarousel({
    images,
    initialIndex: 0,
  })

  const strip = useCarouselStrip({
    images,
    currentIndex,
    totalImages,
    goToIndex,
  })

  const zoneCallbacks = useMemo(
    () => ({
      onLeft: () => {
        if (currentIndex === 0) strip.startWrapPrev()
        else goPrevious()
      },
      onRight: () => {
        if (currentIndex === totalImages - 1) strip.startWrapNext()
        else goNext()
      },
      onCenter: () => {
        // Центральная зона: можно подключить callback через props при необходимости
      },
    }),
    [currentIndex, totalImages, goNext, goPrevious, strip.startWrapNext, strip.startWrapPrev],
  )

  const zones = useCarouselZones({ isTop, callbacks: zoneCallbacks })

  useEffect(() => {
    onImageChange?.(currentIndex)
  }, [currentIndex, onImageChange])

  if (images.length === 0) {
    return <div className={cn('absolute inset-0', className)} />
  }

  if (images.length === 1) {
    return (
      <div className={cn('absolute inset-0', className)}>
        <Image
          src={images[0]}
          alt={imageAlt}
          className={cn('h-full w-full object-cover', blur && 'blur-[2px]')}
          loading="eager"
        />
      </div>
    )
  }

  const indicatorPositionClass =
    align === 'bottom'
      ? 'absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-5rem)] z-10'
      : 'absolute top-6 left-1/2 -translate-x-1/2 w-[calc(100%-5rem)] z-10'

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {showIndicators && totalImages > 1 && (
        <div className={indicatorPositionClass}>
          <CarouselIndicators currentIndex={currentIndex} totalImages={totalImages} />
        </div>
      )}

      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <CarouselStrip
          stripSlides={strip.stripSlides}
          totalPositions={strip.totalPositions}
          effectivePosition={strip.effectivePosition}
          isResettingFromClone={strip.isResettingFromClone}
          onAnimationComplete={strip.onAnimationComplete}
          imageAlt={imageAlt}
          blur={blur}
        />
      </div>

      {isTop && enabledImageSwiping && (
        <div className="absolute inset-0 z-[1] flex pointer-events-auto" aria-hidden>
          <div
            className="flex-1"
            onPointerDown={zones.handleLeftPointerDown}
            onPointerMove={zones.handlePointerMove}
            onPointerUp={zones.handlePointerUp}
            onPointerCancel={zones.handlePointerCancel}
            aria-label="Предыдущее фото"
          />
          <div
            className="flex-1"
            onPointerDown={zones.handleCenterPointerDown}
            onPointerMove={zones.handlePointerMove}
            onPointerUp={zones.handlePointerUp}
            onPointerCancel={zones.handlePointerCancel}
            aria-label="Центральная зона"
          />
          <div
            className="flex-1"
            onPointerDown={zones.handleRightPointerDown}
            onPointerMove={zones.handlePointerMove}
            onPointerUp={zones.handlePointerUp}
            onPointerCancel={zones.handlePointerCancel}
            aria-label="Следующее фото"
          />
        </div>
      )}
    </div>
  )
}

export const ImageCarousel = memo(ImageCarouselComponent)
