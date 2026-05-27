import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createAiSearchJob } from '../api/mockAiSearchApi'
import { aiSearchQueryKeys } from '../lib/aiSearchQueryKeys'

export function useCreateAiSearchJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (query: string) => createAiSearchJob(query),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiSearchQueryKeys.jobs() })
      void queryClient.invalidateQueries({ queryKey: aiSearchQueryKeys.quota() })
    },
  })
}
