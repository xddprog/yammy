import { QueryClient } from '@tanstack/react-query'

const STALE_TIME_MS = 5 * 60 * 1000
const GC_TIME_MS = 30 * 60 * 1000

/** Ошибки API с тостом централизованы в {@link throwApiError} (и в отдельных catch при необходимости). */
export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      retry: false,
      retryOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
})
