import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface UseCarouselStripOptions {
  images: string[]
  currentIndex: number
  totalImages: number
  goToIndex: (index: number) => void
}

export interface UseCarouselStripResult {
  stripSlides: string[]
  totalPositions: number
  effectivePosition: number
  isResettingFromClone: boolean
  onAnimationComplete: () => void
  startWrapNext: () => void
  startWrapPrev: () => void
}

export function useCarouselStrip({
  images,
  currentIndex,
  totalImages,
  goToIndex,
}: UseCarouselStripOptions): UseCarouselStripResult {
  const [displayPosition, setDisplayPosition] = useState<number | null>(null)
  const wrappingRef = useRef<'next' | 'prev' | null>(null)
  const resettingFromCloneRef = useRef(false)

  const totalPositions = totalImages + 2
  const stripSlides = useMemo(
    () => (totalImages > 0 ? [images[totalImages - 1], ...images, images[0]] : []),
    [images, totalImages],
  )
  const effectivePosition = displayPosition ?? currentIndex + 1

  useEffect(() => {
    if (displayPosition === null) {
      resettingFromCloneRef.current = false
    }
  }, [displayPosition])

  const onAnimationComplete = useCallback(() => {
    if (wrappingRef.current === 'next') {
      wrappingRef.current = null
      resettingFromCloneRef.current = true
      goToIndex(0)
      setDisplayPosition(null)
    } else if (wrappingRef.current === 'prev') {
      wrappingRef.current = null
      resettingFromCloneRef.current = true
      goToIndex(totalImages - 1)
      setDisplayPosition(null)
    }
  }, [goToIndex, totalImages])

  const startWrapNext = useCallback(() => {
    wrappingRef.current = 'next'
    setDisplayPosition(totalImages + 1)
  }, [totalImages])

  const startWrapPrev = useCallback(() => {
    wrappingRef.current = 'prev'
    setDisplayPosition(0)
  }, [])

  return {
    stripSlides,
    totalPositions,
    effectivePosition,
    isResettingFromClone: resettingFromCloneRef.current,
    onAnimationComplete,
    startWrapNext,
    startWrapPrev,
  }
}
