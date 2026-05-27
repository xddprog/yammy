import {
  buildMockJobResults,
  resolveMockAiSearchFeedUsers,
} from '../lib/mockAiSearchFeedUsers'
import {
  buildMockParsedFromQuery,
  MOCK_DEFAULT_QUOTA,
  MOCK_INITIAL_JOBS,
} from '../lib/mockData'
import type { AiSearchJob, AiSearchJobStatus, AiSearchQuota } from '../types'
import type { UserSearchApiUser } from '@/entities/user/types/types'

/** v3 — результаты job (userIds + highlights) */
const STORAGE_JOBS_KEY = 'yammy_ai_search_jobs_v3'
const STORAGE_QUOTA_KEY = 'yammy_ai_search_quota_v1'

const ACTIVE_STATUSES: AiSearchJobStatus[] = ['queued', 'parsing', 'searching']

type StoreSnapshot = {
  jobs: AiSearchJob[]
  quota: AiSearchQuota
}

let memorySnapshot: StoreSnapshot | null = null
const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((cb) => cb())
}

export function subscribeAiSearchStore(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

function loadFromStorage(): StoreSnapshot {
  if (typeof sessionStorage === 'undefined') {
    return {
      jobs: [...MOCK_INITIAL_JOBS],
      quota: { ...MOCK_DEFAULT_QUOTA },
    }
  }

  try {
    const jobsRaw = sessionStorage.getItem(STORAGE_JOBS_KEY)
    const quotaRaw = sessionStorage.getItem(STORAGE_QUOTA_KEY)
    const jobs = jobsRaw ? (JSON.parse(jobsRaw) as AiSearchJob[]) : [...MOCK_INITIAL_JOBS]
    const quota = quotaRaw ? (JSON.parse(quotaRaw) as AiSearchQuota) : { ...MOCK_DEFAULT_QUOTA }
    if (!jobsRaw) {
      sessionStorage.setItem(STORAGE_JOBS_KEY, JSON.stringify(jobs))
    }
    if (!quotaRaw) {
      sessionStorage.setItem(STORAGE_QUOTA_KEY, JSON.stringify(quota))
    }
    return { jobs, quota }
  } catch {
    return {
      jobs: [...MOCK_INITIAL_JOBS],
      quota: { ...MOCK_DEFAULT_QUOTA },
    }
  }
}

function persist(snapshot: StoreSnapshot): void {
  memorySnapshot = snapshot
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(STORAGE_JOBS_KEY, JSON.stringify(snapshot.jobs))
    sessionStorage.setItem(STORAGE_QUOTA_KEY, JSON.stringify(snapshot.quota))
  }
  notify()
}

function getSnapshot(): StoreSnapshot {
  if (!memorySnapshot) {
    memorySnapshot = loadFromStorage()
  }
  return memorySnapshot
}

function truncateTitle(query: string, max = 40): string {
  const trimmed = query.trim()
  if (!trimmed) return 'Поиск без пожеланий'
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`
}

function updateJob(id: string, patch: Partial<AiSearchJob>): void {
  const snapshot = getSnapshot()
  const jobs = snapshot.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j))
  persist({ ...snapshot, jobs })
}

function scheduleJobLifecycle(jobId: string): void {
  window.setTimeout(() => {
    updateJob(jobId, { status: 'parsing' })
  }, 800)

  window.setTimeout(() => {
    updateJob(jobId, { status: 'searching' })
  }, 2200)

  window.setTimeout(() => {
    const snapshot = getSnapshot()
    const job = snapshot.jobs.find((j) => j.id === jobId)
    if (!job || job.status === 'cancelled' || job.status === 'failed') return
    const parsed = buildMockParsedFromQuery(job.queryText || '')
    const resultCount = 12 + Math.floor(Math.random() * 15)
    updateJob(jobId, {
      status: 'ready',
      completedAt: new Date().toISOString(),
      parsed,
      resultCount,
      results: buildMockJobResults(jobId, resultCount),
    })
  }, 4500)
}

export async function getAiSearchQuota(): Promise<AiSearchQuota> {
  await delay(80)
  return { ...getSnapshot().quota }
}

export async function listAiSearchJobs(): Promise<AiSearchJob[]> {
  await delay(80)
  return [...getSnapshot().jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function getAiSearchJob(id: string): Promise<AiSearchJob | null> {
  await delay(50)
  return getSnapshot().jobs.find((j) => j.id === id) ?? null
}

export async function getAiSearchFeedUsers(jobId: string): Promise<UserSearchApiUser[]> {
  await delay(80)
  const job = getSnapshot().jobs.find((j) => j.id === jobId)
  if (!job?.results?.userIds.length) return []
  return resolveMockAiSearchFeedUsers(job.results.userIds)
}

export async function createAiSearchJob(query: string): Promise<AiSearchJob> {
  await delay(120)
  const snapshot = getSnapshot()
  if (snapshot.quota.remainingToday <= 0 && snapshot.quota.creditsBalance <= 0) {
    throw new Error('Нет доступных запусков')
  }

  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const job: AiSearchJob = {
    id,
    title: truncateTitle(query),
    queryText: query.trim(),
    status: 'queued',
    createdAt: new Date().toISOString(),
    parsed: null,
    resultCount: null,
  }

  const quota = { ...snapshot.quota }
  if (quota.remainingToday > 0) {
    quota.remainingToday -= 1
  } else if (quota.creditsBalance > 0) {
    quota.creditsBalance -= 1
  }

  persist({
    quota,
    jobs: [job, ...snapshot.jobs],
  })

  scheduleJobLifecycle(id)
  return job
}

export async function markAiSearchJobApplied(id: string): Promise<void> {
  await delay(50)
  updateJob(id, { appliedAt: new Date().toISOString() })
}

export function hasActiveAiSearchJobs(jobs: AiSearchJob[]): boolean {
  return jobs.some((j) => ACTIVE_STATUSES.includes(j.status))
}

export function mergeQuotaWithProfileTier(
  quota: AiSearchQuota,
  profileTier?: string | null,
  hasActiveSubscription?: boolean,
): AiSearchQuota {
  const normalized = (profileTier ?? 'free').toLowerCase() as AiSearchQuota['tier']
  const tier: AiSearchQuota['tier'] =
    normalized === 'vip' || normalized === 'premium' ? normalized : 'free'

  const dailyLimit =
    tier === 'premium' ? 5 : tier === 'vip' ? 3 : hasActiveSubscription ? 1 : 0

  return {
    ...quota,
    tier,
    dailyLimit,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
