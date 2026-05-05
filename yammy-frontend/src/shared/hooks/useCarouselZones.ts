import { useCallback, useRef, useState } from 'react'

const DRAG_THRESHOLD = 5

export interface CarouselZoneCallbacks {
  onLeft: () => void
  onRight: () => void
  onCenter?: () => void
}

export interface UseCarouselZonesOptions {
  isTop: boolean
  callbacks: CarouselZoneCallbacks
}

export interface UseCarouselZonesResult {
  isDragging: boolean
  handleLeftPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  handleRightPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  handleCenterPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  handlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
  handlePointerUp: () => void
  handlePointerCancel: () => void
}

type ZoneDirection = 'left' | 'center' | 'right'

export function useCarouselZones({
  isTop,
  callbacks,
}: UseCarouselZonesOptions): UseCarouselZonesResult {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{
    x: number
    y: number
    direction: ZoneDirection
  } | null>(null)

  const clearDrag = useCallback(() => {
    dragStartRef.current = null
    setIsDragging(false)
  }, [])

  const handleLeftPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isTop) return
      dragStartRef.current = { x: e.clientX, y: e.clientY, direction: 'left' }
      setIsDragging(false)
    },
    [isTop],
  )

  const handleRightPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isTop) return
      dragStartRef.current = { x: e.clientX, y: e.clientY, direction: 'right' }
      setIsDragging(false)
    },
    [isTop],
  )

  const handleCenterPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isTop) return
      dragStartRef.current = { x: e.clientX, y: e.clientY, direction: 'center' }
      setIsDragging(false)
    },
    [isTop],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStartRef.current) return

      const deltaX = Math.abs(e.clientX - dragStartRef.current.x)
      const deltaY = Math.abs(e.clientY - dragStartRef.current.y)

      // Вертикальный жест отдаем родительскому скроллу профиля.
      if (deltaY > DRAG_THRESHOLD && deltaY > deltaX) {
        clearDrag()
        return
      }

      if (deltaX > DRAG_THRESHOLD) {
        setIsDragging(true)
      }
    },
    [clearDrag],
  )

  const handlePointerUp = useCallback(() => {
    if (!dragStartRef.current) return
    if (!isDragging) {
      const { direction } = dragStartRef.current
      if (direction === 'left') callbacks.onLeft()
      else if (direction === 'right') callbacks.onRight()
      else if (direction === 'center') callbacks.onCenter?.()
    }
    clearDrag()
  }, [isDragging, callbacks, clearDrag])

  return {
    isDragging,
    handleLeftPointerDown,
    handleRightPointerDown,
    handleCenterPointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel: clearDrag,
  }
}
