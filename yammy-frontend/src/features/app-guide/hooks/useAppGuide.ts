import { useCallback, useEffect, useMemo, useState } from 'react'

import type { AppGuideStep } from '../lib/appGuideSteps'
import { resolveAppGuideSteps } from '../lib/appGuideSteps'
import { hasCompletedAppGuide, markAppGuideCompleted } from '../lib/appGuideStorage'

type UseAppGuideOptions = {
  enabled: boolean
  hasCards: boolean
}

type UseAppGuideResult = {
  open: boolean
  step: AppGuideStep | null
  stepNumber: number
  totalSteps: number
  isLast: boolean
  onNext: () => void
}

export function useAppGuide({ enabled, hasCards }: UseAppGuideOptions): UseAppGuideResult {
  const steps = useMemo(() => resolveAppGuideSteps(hasCards), [hasCards])
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!enabled || hasCompletedAppGuide()) {
      setOpen(false)
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      setOpen(true)
      setStepIndex(0)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [enabled, hasCards])

  const complete = useCallback(() => {
    markAppGuideCompleted()
    setOpen(false)
  }, [])

  const onNext = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      complete()
      return
    }
    setStepIndex((prev) => prev + 1)
  }, [complete, stepIndex, steps.length])

  const step = open ? (steps[stepIndex] ?? null) : null
  const isLast = stepIndex >= steps.length - 1

  return {
    open,
    step,
    stepNumber: stepIndex + 1,
    totalSteps: steps.length,
    isLast,
    onNext,
  }
}
