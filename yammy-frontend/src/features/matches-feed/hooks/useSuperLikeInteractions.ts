import { useCallback, useEffect, useRef, useState } from 'react'

import { triggerHaptic } from '@/shared/lib/haptics'

export interface UseSuperLikeInteractionsOptions {
  onLike?: () => void
  onSuperLike?: () => void
  longPressMs?: number
}

export interface UseSuperLikeInteractionsResult {
  isSuperLikeMode: boolean
  rootRef: React.RefObject<HTMLDivElement | null>
  handleLikePointerDown: React.PointerEventHandler<HTMLButtonElement>
  handleLikePointerUp: React.PointerEventHandler<HTMLButtonElement>
  handleLikePointerLeave: React.PointerEventHandler<HTMLButtonElement>
  handleSuperLikeClick: () => void
}

const DEFAULT_LONG_PRESS_MS = 450

export function useSuperLikeInteractions({
  onLike,
  onSuperLike,
  longPressMs = DEFAULT_LONG_PRESS_MS,
}: UseSuperLikeInteractionsOptions): UseSuperLikeInteractionsResult {
  const [isSuperLikeMode, setIsSuperLikeMode] = useState(false)
  const longPressTimerRef = useRef<number | null>(null)
  const didLongPressRef = useRef(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const onLikeRef = useRef(onLike)
  onLikeRef.current = onLike
  const onSuperLikeRef = useRef(onSuperLike)
  onSuperLikeRef.current = onSuperLike

  const clearLongPressTimer = useCallback((): void => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleLikePointerDown = useCallback<React.PointerEventHandler<HTMLButtonElement>>(
    (event) => {
      event.preventDefault()
      didLongPressRef.current = false

      longPressTimerRef.current = window.setTimeout(() => {
        didLongPressRef.current = true
        setIsSuperLikeMode(true)
        triggerHaptic({ style: 'medium', vibrateMs: 40 })
      }, longPressMs)
    },
    [longPressMs],
  )

  const handleLikePointerUp = useCallback<React.PointerEventHandler<HTMLButtonElement>>(
    (event) => {
      event.preventDefault()
      clearLongPressTimer()

      if (didLongPressRef.current) {
        return
      }

      onLikeRef.current?.()
    },
    [clearLongPressTimer],
  )

  const handleLikePointerLeave = useCallback<React.PointerEventHandler<HTMLButtonElement>>(() => {
    clearLongPressTimer()
  }, [clearLongPressTimer])

  const handleSuperLikeClick = useCallback((): void => {
    onSuperLikeRef.current?.()
    didLongPressRef.current = false
    setIsSuperLikeMode(false)
  }, [])

  useEffect(() => {
    if (!isSuperLikeMode) return

    const handlePointerDownOutside = (event: PointerEvent): void => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        didLongPressRef.current = false
        setIsSuperLikeMode(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDownOutside)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDownOutside)
    }
  }, [isSuperLikeMode])

  return {
    isSuperLikeMode,
    rootRef,
    handleLikePointerDown,
    handleLikePointerUp,
    handleLikePointerLeave,
    handleSuperLikeClick,
  }
}
