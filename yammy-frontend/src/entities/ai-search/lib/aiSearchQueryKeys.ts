const AI_SEARCH_ROOT = ['ai-search'] as const

export const aiSearchQueryKeys = {
  all: AI_SEARCH_ROOT,
  quota: () => [...AI_SEARCH_ROOT, 'quota'] as const,
  jobs: () => [...AI_SEARCH_ROOT, 'jobs'] as const,
  job: (id: string) => [...AI_SEARCH_ROOT, 'job', id] as const,
  feed: (jobId: string) => [...AI_SEARCH_ROOT, 'feed', jobId] as const,
}
