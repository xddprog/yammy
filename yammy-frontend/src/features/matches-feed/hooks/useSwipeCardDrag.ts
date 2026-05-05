import { animate, type MotionValue, type PanInfo, useMotionValueEvent } from 'framer-motion'
import { useCallback } from 'react'

import {
  EXIT_ANIMATION_DURATION,
  MIN_VELOCITY,
  ROTATION_RANGE_PX,
  SPRING_CONFIG,
  SWIPE_THRESHOLD_PX,
} from '../../../shared/lib/swipeOptions'

export interface UseSwipeCardDragOptions {
  x: MotionValue<number>
  progress: MotionValue<number>
  isTop: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

export interface UseSwipeCardDragResult {
  handleDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
  swipeLeft: () => void
  swipeRight: () => void
}

export function useSwipeCardDrag({
  x,
  progress,
  isTop,
  onSwipeLeft,
  onSwipeRight,
}: UseSwipeCardDragOptions): UseSwipeCardDragResult {
  useMotionValueEvent(x, 'change', (value) => {
    if (!isTop) return
    progress.set(Math.min(Math.abs(value) / ROTATION_RANGE_PX, 1))
  })

  const runExitAnimation = useCallback(
    (direction: 'left' | 'right', duration: number = EXIT_ANIMATION_DURATION) => {
      const exitX = direction === 'right' ? window.innerWidth : -window.innerWidth
      animate(x, exitX, {
        type: 'tween',
        duration,
        onComplete: () => {
          if (direction === 'right') {
            onSwipeRight?.()
          } else {
            onSwipeLeft?.()
          }
        },
      })
    },
    [x, onSwipeLeft, onSwipeRight],
  )

  const swipeLeft = useCallback(() => {
    if (!onSwipeLeft) return
    progress.set(1)
    // делаем клик по кнопке чуть более плавным, чем жест
    runExitAnimation('left', EXIT_ANIMATION_DURATION * 2.5)
  }, [onSwipeLeft, progress, runExitAnimation])

  const swipeRight = useCallback(() => {
    if (!onSwipeRight) return
    progress.set(1)
    // делаем клик по кнопке чуть более плавным, чем жест
    runExitAnimation('right', EXIT_ANIMATION_DURATION * 2.5)
  }, [onSwipeRight, progress, runExitAnimation])

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset: offsetX, velocity: velocityX } = info

      const shouldSwipeRight = offsetX.x > SWIPE_THRESHOLD_PX || velocityX.x > MIN_VELOCITY
      const shouldSwipeLeft = offsetX.x < -SWIPE_THRESHOLD_PX || velocityX.x < -MIN_VELOCITY

      if (shouldSwipeRight && onSwipeRight) {
        progress.set(1)
        // используем такую же более плавную скорость, как и для кликов по кнопкам
        runExitAnimation('right', EXIT_ANIMATION_DURATION * 2.5)
        return
      }
      if (shouldSwipeLeft && onSwipeLeft) {
        progress.set(1)
        // используем такую же более плавную скорость, как и для кликов по кнопкам
        runExitAnimation('left', EXIT_ANIMATION_DURATION * 2.5)
        return
      }

      animate(x, 0, { type: 'spring', ...SPRING_CONFIG })
    },
    [x, progress, onSwipeLeft, onSwipeRight, runExitAnimation],
  )

  return { handleDragEnd, swipeLeft, swipeRight }
}
