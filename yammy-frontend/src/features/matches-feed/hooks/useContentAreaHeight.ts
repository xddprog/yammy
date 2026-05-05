import { useCallback, useEffect, useRef, useState } from 'react'

import { MATCHES_OVERLAY_CONTENT_AREA_DEFAULT_HEIGHT } from '../lib/constants'

/**
 * Отслеживает размеры DOM-элемента через ResizeObserver.
 * Возвращает ref для привязки к контейнеру, текущую высоту и ширину в px.
 *
 * Объединяет height/width в один объект состояния —
 * один вызов setState вместо двух при ресайзе.
 */
export function useContentAreaHeight(defaultHeight = MATCHES_OVERLAY_CONTENT_AREA_DEFAULT_HEIGHT) {
  const ref = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ heightPx: defaultHeight, widthPx: 0 })

  const updateDimensions = useCallback(() => {
    const el = ref.current
    if (!el) return
    setDimensions({ heightPx: el.clientHeight, widthPx: el.clientWidth })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    updateDimensions()

    const ro = new ResizeObserver(updateDimensions)
    ro.observe(el)
    return () => ro.disconnect()
  }, [updateDimensions])

  return { ref, ...dimensions }
}
