import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import {
  hasActiveAiSearchJobs,
  listAiSearchJobs,
  subscribeAiSearchStore,
} from '../api/mockAiSearchApi'
import { aiSearchQueryKeys } from '../lib/aiSearchQueryKeys'

export function useAiSearchJobs() {
  const queryClient = useQueryClient()

  useEffect(() => {
    return subscribeAiSearchStore(() => {
      void queryClient.invalidateQueries({ queryKey: aiSearchQueryKeys.all })
    })
  }, [queryClient])

  const query = useQuery({
    queryKey: aiSearchQueryKeys.jobs(),
    queryFn: listAiSearchJobs,
    staleTime: 0,
    refetchInterval: (q) => {
      const jobs = q.state.data
      if (jobs && hasActiveAiSearchJobs(jobs)) {
        return 2000
      }
      return false
    },
  })

  return query
}
