import { useIsFetching, useIsMutating, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

/** Минимум времени показа сплэша (мс). */
const MIN_VISIBLE_MS = 900
/** Даём роуту и хукам время поставить запросы в очередь, прежде чем считать «запросов не было». */
const INITIAL_PROBE_MS = 1400

export function useAppSplashVisible(): boolean {
  const queryClient = useQueryClient()
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const sawAsyncWork = useRef(false)
  const startedAt = useRef(performance.now())
  const [dismissed, setDismissed] = useState(false)

  const inFlightFromHooks = isFetching > 0 || isMutating > 0

  useEffect(() => {
    if (inFlightFromHooks) {
      sawAsyncWork.current = true
    }
  }, [inFlightFromHooks])

  useEffect(() => {
    if (dismissed) {
      return
    }

    const id = window.setInterval(() => {
      const elapsed = performance.now() - startedAt.current
      const busy = queryClient.isFetching() > 0 || queryClient.isMutating() > 0

      if (busy) {
        sawAsyncWork.current = true
        return
      }

      if (elapsed < MIN_VISIBLE_MS) {
        return
      }

      const stillProbing = !sawAsyncWork.current && elapsed < INITIAL_PROBE_MS
      if (stillProbing) {
        return
      }

      setDismissed(true)
    }, 72)

    return (): void => {
      window.clearInterval(id)
    }
  }, [dismissed, queryClient])

  return !dismissed
}
