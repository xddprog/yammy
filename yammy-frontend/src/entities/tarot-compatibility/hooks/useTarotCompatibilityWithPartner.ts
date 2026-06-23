import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTarotCompatibilityJob,
  getTarotCompatibilityWithPartner,
  isTarotCompatibilitySearching,
} from '../api/tarotCompatibilityService'
import { tarotCompatibilityQueryKeys } from '../lib/tarotCompatibilityQueryKeys'
import type { TarotCompatibilityCreatePayload } from '../types'

export function useTarotCompatibilityWithPartner(partnerUserId: string | undefined) {
  return useQuery({
    queryKey: tarotCompatibilityQueryKeys.withPartner(partnerUserId ?? ''),
    queryFn: () => getTarotCompatibilityWithPartner(partnerUserId!),
    enabled: Boolean(partnerUserId),
    staleTime: 0,
    refetchInterval: (query) => {
      const item = query.state.data?.item
      if (isTarotCompatibilitySearching(item)) {
        return 4000
      }
      return false
    },
  })
}

export function useCreateTarotCompatibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TarotCompatibilityCreatePayload) => createTarotCompatibilityJob(payload),
    onSuccess: (job) => {
      void queryClient.invalidateQueries({
        queryKey: tarotCompatibilityQueryKeys.withPartner(job.partnerUserId),
      })
    },
  })
}
