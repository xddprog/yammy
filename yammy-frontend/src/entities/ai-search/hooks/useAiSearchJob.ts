import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { getAiSearchFeedUsers, getAiSearchJob, subscribeAiSearchStore } from '../api/mockAiSearchApi'
import { aiSearchQueryKeys } from '../lib/aiSearchQueryKeys'

export function useAiSearchJob(jobId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    return subscribeAiSearchStore(() => {
      void queryClient.invalidateQueries({ queryKey: aiSearchQueryKeys.all })
    })
  }, [queryClient])

  return useQuery({
    queryKey: aiSearchQueryKeys.job(jobId ?? ''),
    queryFn: () => getAiSearchJob(jobId!),
    enabled: Boolean(jobId),
    staleTime: 0,
  })
}

export function useAiSearchFeed(jobId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    return subscribeAiSearchStore(() => {
      void queryClient.invalidateQueries({ queryKey: aiSearchQueryKeys.all })
    })
  }, [queryClient])

  return useQuery({
    queryKey: aiSearchQueryKeys.feed(jobId ?? ''),
    queryFn: () => getAiSearchFeedUsers(jobId!),
    enabled: Boolean(jobId),
    staleTime: 0,
  })
}
