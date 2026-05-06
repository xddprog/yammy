import type { PanInfo } from 'framer-motion'
import { animate, useDragControls, useMotionValue, useTransform } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'

import {
  MATCHES_OVERLAY_BOTTOM_RESERVE_PX,
  MATCHES_OVERLAY_CAROUSEL_CARD_GAP_PX,
  MATCHES_OVERLAY_CAROUSEL_HEIGHT_RATIO,
  MATCHES_OVERLAY_CONTAINER_RADIUS,
  MATCHES_OVERLAY_DRAG_VELOCITY_THRESHOLD,
  MATCHES_OVERLAY_EXPANDED_TOP_PADDING_PX,
  MATCHES_OVERLAY_PADDING_HORIZONTAL_PX,
  MATCHES_OVERLAY_PILL_HEIGHT,
  MATCHES_OVERLAY_PILL_TOP_MARGIN,
  MATCHES_OVERLAY_PILL_WIDTH,
  MATCHES_OVERLAY_SPRING_EXPAND,
  MATCHES_OVERLAY_SPRING_INDICATOR,
  MATCHES_OVERLAY_TRANSFORM_CAROUSEL_OPACITY_END,
  MATCHES_OVERLAY_TRANSFORM_CARD_MARGIN_END,
  MATCHES_OVERLAY_TRANSFORM_PILL_OPACITY_START,
} from '../lib/constants'

const TOP_SAFE_AREA = MATCHES_OVERLAY_PILL_HEIGHT + MATCHES_OVERLAY_PILL_TOP_MARGIN

export function useMatchesOverlayMotion(contentAreaHeightPx: number, contentAreaWidthPx: number) {
  const dragY = useMotionValue(0)
  const dragControls = useDragControls()
  const [isExpanded, setIsExpanded] = useState(false)

  const { carouselHeight, cardHeightBase, cardInitialTop, dragLimit } = useMemo(() => {
    const contentHeight = Math.max(0, contentAreaHeightPx - MATCHES_OVERLAY_BOTTOM_RESERVE_PX)
    const carouselHeight = contentHeight * MATCHES_OVERLAY_CAROUSEL_HEIGHT_RATIO
    const cardHeightBase = contentHeight * (1 - MATCHES_OVERLAY_CAROUSEL_HEIGHT_RATIO)
    const cardInitialTop = carouselHeight
    const dragLimit = -Math.max(
      0,
      carouselHeight - TOP_SAFE_AREA - MATCHES_OVERLAY_EXPANDED_TOP_PADDING_PX,
    )
    return { carouselHeight, cardHeightBase, cardInitialTop, dragLimit }
  }, [contentAreaHeightPx])

  /** Ненулевой конец диапазона для useTransform, когда разворот недоступен (dragLimit === 0) */
  const motionDragEnd = dragLimit < 0 ? dragLimit : -1e-6

  const expandedCarouselHeight = MATCHES_OVERLAY_PILL_HEIGHT + MATCHES_OVERLAY_EXPANDED_TOP_PADDING_PX

  const containerHeight = useTransform(
    dragY,
    [0, motionDragEnd],
    [carouselHeight, expandedCarouselHeight],
  )

  const pillPaddingTop = useTransform(
    dragY,
    [0, motionDragEnd],
    [0, MATCHES_OVERLAY_EXPANDED_TOP_PADDING_PX],
  )

  const fullWidth = Math.max(
    MATCHES_OVERLAY_PILL_WIDTH,
    contentAreaWidthPx - MATCHES_OVERLAY_PADDING_HORIZONTAL_PX * 2,
  )

  const containerWidth = useTransform(
    dragY,
    [
      0,
      motionDragEnd * 0.25,
      motionDragEnd * 0.55,
      motionDragEnd * 0.8,
      motionDragEnd,
    ],
    [fullWidth, fullWidth * 0.88, fullWidth * 0.62, MATCHES_OVERLAY_PILL_WIDTH * 1.15, MATCHES_OVERLAY_PILL_WIDTH],
  )

  const containerRadius = useTransform(
    dragY,
    [0, motionDragEnd],
    [MATCHES_OVERLAY_CONTAINER_RADIUS, MATCHES_OVERLAY_PILL_HEIGHT / 2],
  )

  const carouselOpacity = useTransform(
    dragY,
    [0, motionDragEnd * MATCHES_OVERLAY_TRANSFORM_CAROUSEL_OPACITY_END],
    [1, 0],
  )

  const pillContentOpacity = useTransform(
    dragY,
    [motionDragEnd * MATCHES_OVERLAY_TRANSFORM_PILL_OPACITY_START, motionDragEnd],
    [0, 1],
  )

  const pillContentScale = useTransform(
    dragY,
    [motionDragEnd * MATCHES_OVERLAY_TRANSFORM_PILL_OPACITY_START, motionDragEnd],
    [0.8, 1],
  )

  const cardMarginTop = useTransform(
    dragY,
    [0, motionDragEnd * MATCHES_OVERLAY_TRANSFORM_CARD_MARGIN_END],
    [MATCHES_OVERLAY_CAROUSEL_CARD_GAP_PX, 0],
  )

  const cardHeight = useTransform(dragY, (v) => `${cardHeightBase - v}px`)

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const shouldExpand =
        info.velocity.y < MATCHES_OVERLAY_DRAG_VELOCITY_THRESHOLD ||
        dragY.get() < motionDragEnd * MATCHES_OVERLAY_TRANSFORM_CAROUSEL_OPACITY_END
      const targetY = shouldExpand ? dragLimit : 0
      animate(dragY, targetY, {
        type: 'spring',
        ...MATCHES_OVERLAY_SPRING_EXPAND,
        onComplete: () => setIsExpanded(shouldExpand),
      })
    },
    [dragY, dragLimit, motionDragEnd],
  )

  const handleIndicatorClick = useCallback(() => {
    const target = isExpanded ? 0 : dragLimit
    animate(dragY, target, { type: 'spring', ...MATCHES_OVERLAY_SPRING_INDICATOR })
    setIsExpanded(!isExpanded)
  }, [isExpanded, dragY, dragLimit])

  return {
    dragY,
    dragControls,
    isExpanded,
    cardInitialTop,
    dragLimit,
    containerHeight,
    containerWidth,
    containerRadius,
    carouselOpacity,
    pillContentOpacity,
    pillContentScale,
    pillPaddingTop,
    cardMarginTop,
    cardHeight,
    handleDragEnd,
    handleIndicatorClick,
  }
}
