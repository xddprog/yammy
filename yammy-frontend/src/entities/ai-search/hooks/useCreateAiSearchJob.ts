import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createAiSearchJob } from '../api/aiSearchService'
import { aiSearchQueryKeys } from '../lib/aiSearchQueryKeys'
import type { AiSearchCreatePayload } from '../lib/aiSearchGender'

export function useCreateAiSearchJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AiSearchCreatePayload) => createAiSearchJob(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiSearchQueryKeys.jobs() })
    },
  })
}
