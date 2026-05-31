import { useQuery } from '@tanstack/react-query'

import { getAiSearchFeed, getAiSearchJob } from '../api/aiSearchService'
import { aiSearchQueryKeys } from '../lib/aiSearchQueryKeys'

export function useAiSearchJob(jobId: string | undefined) {
  return useQuery({
    queryKey: aiSearchQueryKeys.job(jobId ?? ''),
    queryFn: () => getAiSearchJob(jobId!),
    enabled: Boolean(jobId),
    staleTime: 0,
  })
}

export function useAiSearchFeed(jobId: string | undefined) {
  return useQuery({
    queryKey: aiSearchQueryKeys.feed(jobId ?? ''),
    queryFn: () => getAiSearchFeed(jobId!),
    enabled: Boolean(jobId),
    staleTime: 0,
  })
}
