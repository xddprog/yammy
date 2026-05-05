import type { MotionValue } from 'framer-motion'
import { useMotionValue, useTransform } from 'framer-motion'

import {
  MAX_ROTATION_DEG,
  ROTATION_RANGE_PX,
  STACK_SCALE_STEP,
  VERTICAL_OFFSET_PX,
} from '../../../shared/lib/swipeOptions'

export interface UseSwipeCardMotionOptions {
  stackIndex: number
  stackProgress?: MotionValue<number> | null
}

export interface UseSwipeCardMotionResult {
  x: MotionValue<number>
  rotate: MotionValue<number>
  y: MotionValue<number>
  scale: MotionValue<number>
  progress: MotionValue<number>
}

export function useSwipeCardMotion({
  stackIndex,
  stackProgress,
}: UseSwipeCardMotionOptions): UseSwipeCardMotionResult {
  const x = useMotionValue(0)
  const rotate = useTransform(
    x,
    [-ROTATION_RANGE_PX, ROTATION_RANGE_PX],
    [-MAX_ROTATION_DEG, MAX_ROTATION_DEG],
  )
  const y = useTransform(
    x,
    [-ROTATION_RANGE_PX, 0, ROTATION_RANGE_PX],
    [VERTICAL_OFFSET_PX, 0, VERTICAL_OFFSET_PX],
  )
  const localProgress = useMotionValue(0)
  const progress = stackProgress ?? localProgress
  const scale = useTransform(progress, (value) =>
    stackIndex === 0 ? 1 : 1 + (1 - value) * STACK_SCALE_STEP,
  )

  return { x, rotate, y, scale, progress }
}
