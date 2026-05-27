import { useQuery } from '@tanstack/react-query'

import { getAiSearchQuota, mergeQuotaWithProfileTier } from '../api/mockAiSearchApi'
import { aiSearchQueryKeys } from '../lib/aiSearchQueryKeys'
import type { AiSearchQuota } from '../types'

export function useAiSearchQuota(profileTier?: string | null, hasActiveSubscription?: boolean) {
  return useQuery({
    queryKey: [...aiSearchQueryKeys.quota(), profileTier ?? 'free', hasActiveSubscription ?? false],
    queryFn: async (): Promise<AiSearchQuota> => {
      const quota = await getAiSearchQuota()
      return mergeQuotaWithProfileTier(quota, profileTier, hasActiveSubscription)
    },
    staleTime: 5_000,
  })
}
