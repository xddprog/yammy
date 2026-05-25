import { useEffect } from 'react'

type UseInfiniteScrollLoadMoreParams = {
  scrollRootRef: React.RefObject<HTMLElement | null>
  sentinelRef: React.RefObject<HTMLElement | null>
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

export function useInfiniteScrollLoadMore({
  scrollRootRef,
  sentinelRef,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UseInfiniteScrollLoadMoreParams): void {
  useEffect(() => {
    const root = scrollRootRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel || !hasNextPage) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root, rootMargin: '120px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [scrollRootRef, sentinelRef, hasNextPage, isFetchingNextPage, fetchNextPage])
}
