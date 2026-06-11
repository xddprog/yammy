import { useEffect, useState } from 'react'

import { needsAsyncMediaResolve, resolveMediaSrc } from './resolveMediaSrc'

export function useResolvedMediaSrc(src: string): string {
  const [resolved, setResolved] = useState(() => (needsAsyncMediaResolve(src) ? '' : src))

  useEffect(() => {
    if (!src) {
      setResolved('')
      return
    }
    if (!needsAsyncMediaResolve(src)) {
      setResolved(src)
      return
    }

    let cancelled = false
    setResolved('')

    void resolveMediaSrc(src)
      .then((url) => {
        if (!cancelled) {
          setResolved(url)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolved(src)
        }
      })

    return () => {
      cancelled = true
    }
  }, [src])

  return resolved
}
