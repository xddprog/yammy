import type { AiSearchJob } from '../types'

export function hasAiSearchResults(job: AiSearchJob): boolean {
  return (job.resultCount ?? 0) > 0
}

/** Есть что показать в ленте (в т.ч. legacy failed с result_count). */
export function canOpenAiSearchResults(job: AiSearchJob): boolean {
  return hasAiSearchResults(job) && (job.status === 'ready' || job.status === 'failed')
}

export function shouldShowAiSearchFailure(job: AiSearchJob): boolean {
  return job.status === 'failed' && !hasAiSearchResults(job)
}
