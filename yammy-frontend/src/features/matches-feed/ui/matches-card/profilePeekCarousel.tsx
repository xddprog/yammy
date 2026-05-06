import { animate, motion, useMotionValue } from 'framer-motion'
import { memo, useCallback, useMemo, useRef, useState } from 'react'

import { cn, Image, useOverlay } from '@/shared'

interface ProfilePeekCarouselProps {
  images: string[]
  imageAlt: string
  enabledImageSwiping?: boolean
  className?: string
}

const ProfilePeekCarouselComponent = ({
  images,
  imageAlt,
  enabledImageSwiping = true,
  className,
}: ProfilePeekCarouselProps): React.JSX.Element => {
  const { open } = useOverlay()
  const total = images.length
  const sideTilt = 2.5
  const sideOpacity = 0.62
  const sideToCenterScale = 82 / 70
  const centerToSideScale = 70 / 82
  const animationDuration = 0.22
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const shiftX = useMotionValue(0)
  const prevRotate = useMotionValue(-sideTilt)
  const currentRotate = useMotionValue(0)
  const nextRotate = useMotionValue(sideTilt)
  const prevScale = useMotionValue(1)
  const currentScale = useMotionValue(1)
  const nextScale = useMotionValue(1)
  const prevOpacity = useMotionValue(sideOpacity)
  const currentOpacity = useMotionValue(1)
  const nextOpacity = useMotionValue(sideOpacity)
  const trackRef = useRef<HTMLDivElement | null>(null)

  const normalizedIndex = useMemo(
    () => (total > 0 ? ((currentIndex % total) + total) % total : 0),
    [currentIndex, total],
  )
  const previousIndex = total > 1 ? (normalizedIndex - 1 + total) % total : normalizedIndex
  const nextIndex = total > 1 ? (normalizedIndex + 1) % total : normalizedIndex

  const getSlideStep = useCallback((): number => {
    const trackElement = trackRef.current
    if (!trackElement) return 22

    const [prevElement, currentElement, nextElement] = Array.from(
      trackElement.querySelectorAll<HTMLElement>('[data-carousel-item="true"]'),
    )

    if (!currentElement || !nextElement || !prevElement) return 22

    const currentRect = currentElement.getBoundingClientRect()
    const nextRect = nextElement.getBoundingClientRect()
    const prevRect = prevElement.getBoundingClientRect()

    const stepToNext =
      nextRect.left + nextRect.width / 2 - (currentRect.left + currentRect.width / 2)
    const stepToPrev =
      currentRect.left + currentRect.width / 2 - (prevRect.left + prevRect.width / 2)

    return Math.max(stepToNext, stepToPrev, 22)
  }, [])

  const goPrevious = () => {
    if (!enabledImageSwiping || total <= 1 || isAnimating) return
    setIsAnimating(true)
    const slideStep = getSlideStep()
    animate(prevRotate, 0, { duration: animationDuration, ease: 'easeInOut' })
    animate(currentRotate, sideTilt, { duration: animationDuration, ease: 'easeInOut' })
    animate(prevScale, sideToCenterScale, { duration: animationDuration, ease: 'easeInOut' })
    animate(currentScale, centerToSideScale, { duration: animationDuration, ease: 'easeInOut' })
    animate(prevOpacity, 1, { duration: animationDuration, ease: 'easeInOut' })
    animate(currentOpacity, sideOpacity, { duration: animationDuration, ease: 'easeInOut' })
    animate(shiftX, slideStep, {
      duration: animationDuration,
      ease: 'easeInOut',
      onComplete: () => {
        setCurrentIndex((prev) => prev - 1)
        shiftX.set(0)
        prevRotate.set(-sideTilt)
        currentRotate.set(0)
        nextRotate.set(sideTilt)
        prevScale.set(1)
        currentScale.set(1)
        nextScale.set(1)
        prevOpacity.set(sideOpacity)
        currentOpacity.set(1)
        nextOpacity.set(sideOpacity)
        setIsAnimating(false)
      },
    })
  }

  const goNext = () => {
    if (!enabledImageSwiping || total <= 1 || isAnimating) return
    setIsAnimating(true)
    const slideStep = getSlideStep()
    animate(currentRotate, -sideTilt, { duration: animationDuration, ease: 'easeInOut' })
    animate(nextRotate, 0, { duration: animationDuration, ease: 'easeInOut' })
    animate(currentScale, centerToSideScale, { duration: animationDuration, ease: 'easeInOut' })
    animate(nextScale, sideToCenterScale, { duration: animationDuration, ease: 'easeInOut' })
    animate(currentOpacity, sideOpacity, { duration: animationDuration, ease: 'easeInOut' })
    animate(nextOpacity, 1, { duration: animationDuration, ease: 'easeInOut' })
    animate(shiftX, -slideStep, {
      duration: animationDuration,
      ease: 'easeInOut',
      onComplete: () => {
        setCurrentIndex((prev) => prev + 1)
        shiftX.set(0)
        prevRotate.set(-sideTilt)
        currentRotate.set(0)
        nextRotate.set(sideTilt)
        prevScale.set(1)
        currentScale.set(1)
        nextScale.set(1)
        prevOpacity.set(sideOpacity)
        currentOpacity.set(1)
        nextOpacity.set(sideOpacity)
        setIsAnimating(false)
      },
    })
  }

  const openImageModal = useCallback(
    (index: number) => {
      open({
        backdropClassName: 'bg-black/80 backdrop-blur-0',
        panelClassName:
          '!h-full !w-full !max-w-none flex items-center justify-center p-4 pointer-events-none',
        content: () => (
          <div
            className="pointer-events-auto overflow-hidden rounded-[24px] bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={images[index]}
              alt={`${imageAlt} full`}
              className="block h-auto max-h-[88vh] w-auto max-w-[92vw] object-contain"
            />
          </div>
        ),
      })
    },
    [open, images, imageAlt],
  )

  if (total === 0) {
    return <div className={cn('absolute inset-0', className)} />
  }

  return (
    <div className={cn('absolute inset-0 overflow-visible', className)}>
      <div className="absolute inset-x-0 top-[-3%] z-[2] h-[110%] overflow-visible">
        <motion.div
          ref={trackRef}
          className="absolute inset-0 flex h-full items-center justify-center gap-[4.5%]"
          style={{ x: shiftX }}
        >
          <motion.button
            type="button"
            data-carousel-item="true"
            className="relative h-[70%] shrink-0 overflow-hidden rounded-[24px] aspect-[1/1.9]"
            onClick={goPrevious}
            aria-label="Предыдущее фото"
            style={{ rotate: prevRotate, scale: prevScale, opacity: prevOpacity }}
          >
            <Image
              src={images[previousIndex]}
              alt={`${imageAlt} prev`}
              className="h-full w-full object-cover"
            />
          </motion.button>

          <motion.button
            type="button"
            data-carousel-item="true"
            className="h-[82%] shrink-0 overflow-hidden rounded-[30px] aspect-[1/1.9]"
            onClick={() => openImageModal(normalizedIndex)}
            aria-label="Открыть текущее фото"
            style={{ rotate: currentRotate, scale: currentScale, opacity: currentOpacity }}
          >
            <Image
              src={images[normalizedIndex]}
              alt={`${imageAlt} ${normalizedIndex + 1}`}
              className="h-full w-full object-cover"
            />
          </motion.button>

          <motion.button
            type="button"
            data-carousel-item="true"
            className="relative h-[70%] shrink-0 overflow-hidden rounded-[24px] aspect-[1/1.9]"
            onClick={goNext}
            aria-label="Следующее фото"
            style={{ rotate: nextRotate, scale: nextScale, opacity: nextOpacity }}
          >
            <Image src={images[nextIndex]} alt={`${imageAlt} next`} className="h-full w-full object-cover" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export const ProfilePeekCarousel = memo(ProfilePeekCarouselComponent)
