import { useQuery } from '@tanstack/react-query'

import {
  hasActiveAiSearchJobs,
  listAiSearchJobs,
} from '../api/aiSearchService'
import { aiSearchQueryKeys } from '../lib/aiSearchQueryKeys'

export function useAiSearchJobs() {
  return useQuery({
    queryKey: aiSearchQueryKeys.jobs(),
    queryFn: listAiSearchJobs,
    staleTime: 0,
    refetchInterval: (q) => {
      const jobs = q.state.data?.jobs
      if (jobs && hasActiveAiSearchJobs(jobs)) {
        return 5000
      }
      return false
    },
  })
}
