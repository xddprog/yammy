import type { MotionValue } from 'framer-motion'
import { useMotionValue } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { FeedStackCardUser } from '@/entities/user/types/types'
import { prefetchMediaSrc } from '@/shared/lib/media'

const MAX_VISIBLE_CARDS = 3
const DEFAULT_NEAR_END_THRESHOLD = 5
const PREFETCH_AHEAD = 3

export interface UseSwipeFeedOptions<T extends FeedStackCardUser = FeedStackCardUser> {
  initialItems: T[]
  onSwipeLeft?: (item: T) => void
  onSwipeRight?: (item: T) => void
  onSuperLike?: (item: T, message: string) => void
  onEmpty?: () => void
  /** Вызывается при приближении к концу ленты. Используйте для подгрузки новых элементов. */
  onNearEnd?: (remainingCount: number) => void
  /** За сколько карточек до конца вызывать onNearEnd. По умолчанию: 5 */
  nearEndThreshold?: number
}

export interface UseSwipeFeedResult<T extends FeedStackCardUser = FeedStackCardUser> {
  visibleItems: T[]
  remainingCount: number
  stackProgress: MotionValue<number>
  handleSwipeLeft: () => void
  handleSwipeRight: () => void
  handleSuperLike: (message: string) => void
  /** Подмешивание после refetch; элементы должны совпадать с типом ленты (`T`). */
  appendItems: (newItems: FeedStackCardUser[]) => number
}

function feedBatchFingerprint(items: FeedStackCardUser[]): string {
  return items.map((item) => item.user_id).join('\0')
}

function prefetchImages(urls: string[]): void {
  for (const url of urls) {
    if (url) {
      prefetchMediaSrc(url)
    }
  }
}

/**
 * Хук управления лентой свайпов.
 *
 * Очередь карточек синхронизируется с `initialItems` (ответ API): при новой пачке
 * с бэка сбрасывается позиция. Локально хранится только `currentIndex` для O(1) свайпов.
 */
export function useSwipeFeed<T extends FeedStackCardUser = FeedStackCardUser>({
  initialItems,
  onSwipeLeft,
  onSwipeRight,
  onSuperLike,
  onEmpty,
  onNearEnd,
  nearEndThreshold = DEFAULT_NEAR_END_THRESHOLD,
}: UseSwipeFeedOptions<T>): UseSwipeFeedResult<T> {
  const [items, setItems] = useState<T[]>(initialItems)
  const [currentIndex, setCurrentIndex] = useState(0)
  const stackProgress = useMotionValue(0)

  const initialFingerprint = useMemo(
    () => feedBatchFingerprint(initialItems),
    [initialItems],
  )

  useEffect(() => {
    setItems(initialItems)
    setCurrentIndex(0)
  }, [initialFingerprint, initialItems])

  const callbacksRef = useRef({ onSwipeLeft, onSwipeRight, onSuperLike, onEmpty, onNearEnd })
  callbacksRef.current = { onSwipeLeft, onSwipeRight, onSuperLike, onEmpty, onNearEnd }

  const itemsRef = useRef(items)
  itemsRef.current = items

  const currentIndexRef = useRef(currentIndex)
  currentIndexRef.current = currentIndex

  const remainingCount = items.length - currentIndex

  const visibleItems = useMemo(
    () => items.slice(currentIndex, currentIndex + MAX_VISIBLE_CARDS),
    [items, currentIndex],
  )

  useEffect(() => {
    const prefetchStart = currentIndex + MAX_VISIBLE_CARDS
    const prefetchEnd = Math.min(prefetchStart + PREFETCH_AHEAD, items.length)
    for (let i = prefetchStart; i < prefetchEnd; i++) {
      prefetchImages(items[i].photos)
    }
  }, [currentIndex, items])

  useEffect(() => {
    if (remainingCount > 0 && remainingCount <= nearEndThreshold) {
      callbacksRef.current.onNearEnd?.(remainingCount)
    }
  }, [remainingCount, nearEndThreshold])

  const advanceCard = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1
      if (next >= itemsRef.current.length) {
        callbacksRef.current.onEmpty?.()
      }
      return next
    })
    stackProgress.set(0)
  }, [stackProgress])

  const handleSwipeLeft = useCallback(() => {
    const top = itemsRef.current[currentIndexRef.current]
    if (top) {
      callbacksRef.current.onSwipeLeft?.(top)
      advanceCard()
    }
  }, [advanceCard])

  const handleSwipeRight = useCallback(() => {
    const top = itemsRef.current[currentIndexRef.current]
    if (top) {
      callbacksRef.current.onSwipeRight?.(top)
      advanceCard()
    }
  }, [advanceCard])

  const handleSuperLike = useCallback(
    (message: string) => {
      const top = itemsRef.current[currentIndexRef.current]
      if (top) {
        callbacksRef.current.onSuperLike?.(top, message)
        advanceCard()
      }
    },
    [advanceCard],
  )

  const appendItems = useCallback((newItems: FeedStackCardUser[]) => {
    let toAdd: T[] = []
    setItems((prev) => {
      const ids = new Set(prev.map((i) => i.user_id))
      toAdd = (newItems as T[]).filter((i) => !ids.has(i.user_id))
      return toAdd.length ? [...prev, ...toAdd] : prev
    })
    return toAdd.length
  }, [])

  const topItemId = visibleItems[0]?.user_id
  useEffect(() => {
    stackProgress.set(0)
  }, [stackProgress, topItemId])

  return {
    visibleItems,
    remainingCount,
    stackProgress,
    handleSwipeLeft,
    handleSwipeRight,
    handleSuperLike,
    appendItems,
  }
}
