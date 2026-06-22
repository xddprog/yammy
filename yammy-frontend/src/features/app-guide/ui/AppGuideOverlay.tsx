import { AnimatePresence, motion } from 'framer-motion'
import type { JSX } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button, cn } from '@/shared'

import type { AppGuidePlacement, AppGuideStep } from '../lib/appGuideSteps'

type TargetRect = {
  top: number
  left: number
  width: number
  height: number
}

type TooltipPosition = {
  top: number
  left: number
}

type AppGuideOverlayProps = {
  open: boolean
  step: AppGuideStep | null
  stepNumber: number
  totalSteps: number
  isLast: boolean
  onNext: () => void
}

const overlayEase = [0.22, 0.61, 0.36, 1] as const

const spotlightTransition = { duration: 0.42, ease: overlayEase } as const
const backdropTransition = { duration: 0.42, ease: overlayEase } as const
const tooltipMoveTransition = { duration: 0.42, ease: overlayEase } as const
const contentTransition = { duration: 0.3, ease: overlayEase } as const
const overlayFadeTransition = { duration: 0.32, ease: overlayEase } as const

const TOOLTIP_WIDTH = 320
const TOOLTIP_GAP = 16
const VIEWPORT_PADDING = 16
const ESTIMATED_TOOLTIP_HEIGHT = 196

const clipPathTransition =
  'clip-path 0.42s cubic-bezier(0.22, 0.61, 0.36, 1), -webkit-clip-path 0.42s cubic-bezier(0.22, 0.61, 0.36, 1)'

const backdropPanelClassName =
  'pointer-events-auto fixed bg-black/50 backdrop-blur-sm [transform:translateZ(0)]'

function buildHoleClipPath(
  rect: TargetRect,
  viewport: ReturnType<typeof getViewportBounds>,
): string {
  const { top, left, width, height } = rect
  const right = left + width
  const bottom = top + height
  const vw = viewport.width
  const vh = viewport.height

  return `polygon(evenodd, 0px 0px, ${vw}px 0px, ${vw}px ${vh}px, 0px ${vh}px, 0px 0px, ${left}px ${top}px, ${right}px ${top}px, ${right}px ${bottom}px, ${left}px ${bottom}px, ${left}px ${top}px)`
}

function getViewportBounds(): {
  top: number
  left: number
  width: number
  height: number
} {
  const viewport = window.visualViewport

  return {
    top: viewport?.offsetTop ?? 0,
    left: viewport?.offsetLeft ?? 0,
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  }
}

function GuideBackdrop({ targetRect }: { targetRect: TargetRect | null }): JSX.Element {
  const viewport = getViewportBounds()

  if (targetRect == null) {
    return (
      <motion.div
        className={cn(backdropPanelClassName, 'inset-0')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={backdropTransition}
        aria-hidden
      />
    )
  }

  const clipPath = buildHoleClipPath(targetRect, viewport)

  return (
    <div
      className={backdropPanelClassName}
      style={{
        top: 0,
        left: 0,
        width: viewport.width,
        height: viewport.height,
        clipPath,
        WebkitClipPath: clipPath,
        transition: clipPathTransition,
      }}
      aria-hidden
    />
  )
}

function GuideSpotlightRing({
  targetRect,
  borderRadius,
}: {
  targetRect: TargetRect
  borderRadius: number
}): JSX.Element {
  return (
    <motion.div
      className="pointer-events-none fixed ring-2 ring-white/35"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{
        opacity: 1,
        scale: 1,
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        borderRadius,
      }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={spotlightTransition}
      style={{
        boxShadow: '0 0 0 1px rgba(255,255,255,0.2)',
      }}
      aria-hidden
    />
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getStepTargetId(step: AppGuideStep): string | null {
  if (step.id === 'finish') return null
  if (step.id === 'match-score' || step.id === 'profile-details') return 'details'
  return step.id
}

function measureTarget(step: AppGuideStep): TargetRect | null {
  const targetId = getStepTargetId(step)
  if (targetId == null) return null

  const element = document.querySelector<HTMLElement>(`[data-app-guide="${targetId}"]`)
  if (!element) return null

  const rect = element.getBoundingClientRect()
  const padding = step.padding ?? 8

  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

function computeTooltipPosition(
  placement: AppGuidePlacement,
  target: TargetRect | null,
  tooltipWidth: number,
  tooltipHeight: number,
): TooltipPosition {
  const viewport = getViewportBounds()
  const minTop = viewport.top + VIEWPORT_PADDING
  const minLeft = viewport.left + VIEWPORT_PADDING
  const maxTop = viewport.top + viewport.height - tooltipHeight - VIEWPORT_PADDING
  const maxLeft = viewport.left + viewport.width - tooltipWidth - VIEWPORT_PADDING

  if (placement === 'center' || target == null) {
    return {
      top: clamp(
        viewport.top + (viewport.height - tooltipHeight) / 2,
        minTop,
        maxTop,
      ),
      left: clamp(
        viewport.left + (viewport.width - tooltipWidth) / 2,
        minLeft,
        maxLeft,
      ),
    }
  }

  const centerX = target.left + target.width / 2
  const left = clamp(centerX - tooltipWidth / 2, minLeft, maxLeft)

  const spaceAbove = target.top - minTop
  const spaceBelow = viewport.top + viewport.height - (target.top + target.height) - VIEWPORT_PADDING
  const preferAbove = placement === 'top'
  const fitsAbove = spaceAbove >= tooltipHeight + TOOLTIP_GAP
  const fitsBelow = spaceBelow >= tooltipHeight + TOOLTIP_GAP

  let top: number

  if (preferAbove && fitsAbove) {
    top = target.top - TOOLTIP_GAP - tooltipHeight
  } else if (!preferAbove && fitsBelow) {
    top = target.top + target.height + TOOLTIP_GAP
  } else if (fitsBelow) {
    top = target.top + target.height + TOOLTIP_GAP
  } else if (fitsAbove) {
    top = target.top - TOOLTIP_GAP - tooltipHeight
  } else {
    top = viewport.top + (viewport.height - tooltipHeight) / 2
  }

  return {
    top: clamp(top, minTop, maxTop),
    left,
  }
}

export function AppGuideOverlay({
  open,
  step,
  stepNumber,
  totalSteps,
  isLast,
  onNext,
}: AppGuideOverlayProps): JSX.Element | null {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !step) {
      setTargetRect(null)
      setTooltipPosition(null)
      return
    }

    const targetId = getStepTargetId(step)
    if (targetId == null) {
      setTargetRect(null)
      setTooltipPosition(
        computeTooltipPosition(
          step.placement,
          null,
          TOOLTIP_WIDTH,
          tooltipRef.current?.offsetHeight ?? ESTIMATED_TOOLTIP_HEIGHT,
        ),
      )
      return
    }

    const applyMeasure = (): TargetRect | null => measureTarget(step)

    const initialRect = applyMeasure()
    setTargetRect(initialRect)

    if (initialRect == null) {
      const frameId = window.requestAnimationFrame(() => {
        const retryRect = applyMeasure()
        if (retryRect == null) {
          onNext()
          return
        }
        setTargetRect(retryRect)
      })

      return () => {
        window.cancelAnimationFrame(frameId)
      }
    }

    const target = document.querySelector(`[data-app-guide="${targetId}"]`)
    const resizeObserver =
      target instanceof Element
        ? new ResizeObserver(() => {
            setTargetRect(applyMeasure())
          })
        : null

    resizeObserver?.observe(target as Element)

    const onViewportChange = (): void => {
      setTargetRect(applyMeasure())
    }

    window.addEventListener('resize', onViewportChange)
    window.visualViewport?.addEventListener('resize', onViewportChange)
    window.visualViewport?.addEventListener('scroll', onViewportChange)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', onViewportChange)
      window.visualViewport?.removeEventListener('resize', onViewportChange)
      window.visualViewport?.removeEventListener('scroll', onViewportChange)
    }
  }, [onNext, open, step])

  useLayoutEffect(() => {
    if (!open || !step) {
      setTooltipPosition(null)
      return
    }

    const tooltipWidth = Math.min(
      TOOLTIP_WIDTH,
      (window.visualViewport?.width ?? window.innerWidth) - VIEWPORT_PADDING * 2,
    )
    const tooltipHeight = tooltipRef.current?.offsetHeight ?? ESTIMATED_TOOLTIP_HEIGHT

    setTooltipPosition(
      computeTooltipPosition(step.placement, targetRect, tooltipWidth, tooltipHeight),
    )
  }, [open, step, targetRect, stepNumber, isLast])

  if (typeof document === 'undefined' || !open || !step) return null

  const isPositioned = tooltipPosition != null
  const borderRadius = step.borderRadius ?? 16

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="app-guide-overlay"
          className="pointer-events-none fixed inset-0 z-[1200]"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayFadeTransition}
          style={{ transform: 'none' }}
        >
          <GuideBackdrop targetRect={targetRect} />
          <AnimatePresence mode="wait" initial={false}>
            {targetRect ? (
              <GuideSpotlightRing
                key="spotlight"
                targetRect={targetRect}
                borderRadius={borderRadius}
              />
            ) : null}
          </AnimatePresence>

          <motion.div
            ref={tooltipRef}
            className={cn(
              'pointer-events-auto fixed z-10 w-[min(320px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] overflow-y-auto',
              !isPositioned && 'invisible',
            )}
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{
              opacity: isPositioned ? 1 : 0,
              scale: 1,
              y: 0,
              top: tooltipPosition?.top ?? VIEWPORT_PADDING,
              left: tooltipPosition?.left ?? VIEWPORT_PADDING,
            }}
            transition={tooltipMoveTransition}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.id}
                role="dialog"
                aria-modal="true"
                aria-label={step.title ?? 'Подсказка'}
                className="rounded-[24px] bg-white px-5 pb-4 pt-4 shadow-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={contentTransition}
                onClick={(event) => event.stopPropagation()}
              >
                {step.title ? (
                  <p className="text-left text-[17px] font-medium leading-snug text-[#2a2a2a]">
                    {step.title}
                  </p>
                ) : null}
                <p
                  className={cn(
                    'text-left text-[15px] font-light leading-snug text-[#2a2a2a]',
                    step.title && 'mt-1',
                  )}
                >
                  {step.body}
                </p>
                <div className="mt-4 flex flex-row items-center gap-2">
                  <p className="text-left text-xs text-[#2a2a2a]/50">
                    {stepNumber} / {totalSteps}
                  </p>
                  <Button type="button" className="min-w-0 flex-1" onClick={onNext}>
                    {isLast ? 'Поехали' : 'Далее'}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
