import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import type { Query } from '@tanstack/react-query'

import { formatUserErrorMessage } from '../lib/formatUserErrorMessage'
import { showErrorToast } from '../ui/error-toast/errorToastBus'

const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 30 * 60 * 1000

function retryOnMountIfPreviousFetchFailedWithoutData(query: Query): boolean {
  const { status, data } = query.state
  return status === 'error' && data === undefined
}

const notifyQueryError = (error: unknown): void => {
  const msg = formatUserErrorMessage(error)
  const deliver = (): void => {
    showErrorToast(msg)
  }
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(deliver)
  } else {
    setTimeout(deliver, 0)
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: notifyQueryError,
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      notifyQueryError(error)
    },
  }),
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      retry: false,
      retryOnMount: retryOnMountIfPreviousFetchFailedWithoutData,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
})
