import { adminFetch, adminApi, setAdminSession, clearAdminSession, getAdminAccessToken } from '@/shared/api/adminApi'
import type { AdminUserChat, AdminUserDetail, AdminUserPreview, Paginated, ReportedUserDetail, ReportedUserItem, StatsOverview } from '@/shared/api/types'
import type { AdminReportItem } from '@/shared/api/types'

export type StaffSession = {
  id: string
  username: string
  role: 'admin' | 'support'
}

export async function loginAdmin(username: string, password: string): Promise<StaffSession> {
  const tokens = await adminFetch<{ access_token: string; refresh_token: string }>('auth/login', {
    method: 'POST',
    json: { username, password },
  })
  const me = await adminApi.get('auth/current_user', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  if (!me.ok) throw new Error('Auth failed')
  const staff = (await me.json()) as StaffSession
  setAdminSession(tokens, staff.role)
  return staff
}

export async function fetchCurrentStaff(): Promise<StaffSession | null> {
  if (!getAdminAccessToken()) return null
  try {
    return await adminFetch<StaffSession>('auth/current_user')
  } catch {
    clearAdminSession()
    return null
  }
}

export function logoutAdmin() {
  clearAdminSession()
}

export type StatsOverviewParams =
  | { mode: 'preset'; period: string }
  | { mode: 'custom'; date_from: string; date_to: string }

export async function fetchStatsOverview(params: StatsOverviewParams): Promise<StatsOverview> {
  const qs = new URLSearchParams()
  if (params.mode === 'custom') {
    qs.set('date_from', params.date_from)
    qs.set('date_to', params.date_to)
  } else {
    qs.set('period', params.period)
  }
  return adminFetch(`stats/overview?${qs}`)
}

export async function fetchChatBetweenUsers(userA: string, userB: string): Promise<AdminUserChat> {
  const qs = new URLSearchParams({ user_a: userA, user_b: userB })
  return adminFetch(`moderation/chat-between?${qs}`)
}

export async function fetchModerationProfiles(page = 1, size = 20) {
  return adminFetch<Paginated<AdminUserPreview>>(`moderation/profiles?page=${page}&size=${size}`)
}

export async function fetchModerationProfile(userId: string) {
  return adminFetch<AdminUserDetail>(`moderation/profiles/${userId}`)
}

export async function moderateProfile(userId: string, approved: boolean, note?: string) {
  return adminFetch(`moderation/profiles/${userId}`, {
    method: 'PATCH',
    json: { approved, note },
  })
}

export async function fetchReportedUsers(page = 1, size = 20, hasPending = true, q = '') {
  const params = new URLSearchParams({ page: String(page), size: String(size), has_pending: String(hasPending) })
  if (q) params.set('q', q)
  return adminFetch<Paginated<ReportedUserItem>>(`moderation/reported-users?${params}`)
}

export async function fetchReportedUserDetail(userId: string) {
  return adminFetch<ReportedUserDetail>(`moderation/reported-users/${userId}`)
}

export async function updateReport(reportId: string, status: string, reviewNote?: string) {
  return adminFetch(`reports/${reportId}`, {
    method: 'PATCH',
    json: { status, review_note: reviewNote },
  })
}

export async function resolveAllReports(userId: string) {
  return adminFetch(`moderation/reported-users/${userId}/resolve-all`, { method: 'POST' })
}

export async function fetchFilterCatalog() {
  return adminFetch<import('@/shared/api/types').FilterCategory[]>('filters/')
}

export async function searchUsers(params: Record<string, string | number | boolean | string[] | undefined>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return
    if (Array.isArray(value)) {
      value.forEach((item) => qs.append(key, String(item)))
      return
    }
    qs.set(key, String(value))
  })
  return adminFetch<Paginated<AdminUserPreview>>(`users/?${qs}`)
}

export async function fetchUserDetail(userId: string) {
  return adminFetch<AdminUserDetail>(`users/${userId}`)
}

export async function fetchUserReports(userId: string) {
  return adminFetch<AdminReportItem[]>(`users/${userId}/reports`)
}

export async function banUser(userId: string, isBanned: boolean) {
  return adminFetch(`users/${userId}/ban`, { method: 'PATCH', json: { is_banned: isBanned } })
}

export async function setSubscription(userId: string, tier: string, expiresAt: string | null) {
  return adminFetch(`users/${userId}/subscription`, {
    method: 'PATCH',
    json: { tier, expires_at: expiresAt },
  })
}

export async function setBalances(userId: string, superlikes: number, boosts: number) {
  return adminFetch(`users/${userId}/balances`, {
    method: 'PATCH',
    json: { superlikes_balance: superlikes, boosts_balance: boosts },
  })
}

export async function setModerationFlag(userId: string, approved: boolean) {
  return adminFetch(`users/${userId}/moderation`, {
    method: 'PATCH',
    json: { profile_moderation_approved: approved },
  })
}
