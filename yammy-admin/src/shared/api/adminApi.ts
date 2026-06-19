import ky from 'ky'

import { ADMIN_API_PREFIX } from '@/shared/config/apiBaseUrl'

const ACCESS_KEY = 'yammy_admin_access'
const REFRESH_KEY = 'yammy_admin_refresh'
const ROLE_KEY = 'yammy_admin_role'

export type StaffRole = 'admin' | 'support'

export function getAdminAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getAdminRole(): StaffRole | null {
  const role = localStorage.getItem(ROLE_KEY)
  return role === 'admin' || role === 'support' ? role : null
}

export function setAdminSession(tokens: { access_token: string; refresh_token: string }, role: StaffRole) {
  localStorage.setItem(ACCESS_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
  localStorage.setItem(ROLE_KEY, role)
}

export function clearAdminSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export const adminApi = ky.create({
  prefixUrl: ADMIN_API_PREFIX,
  throwHttpErrors: false,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAdminAccessToken()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status !== 401) return response
        const refresh = localStorage.getItem(REFRESH_KEY)
        if (!refresh) return response
        const refreshed = await ky.post(`${ADMIN_API_PREFIX}/auth/refresh`, {
          json: { refresh_token: refresh },
          throwHttpErrors: false,
        })
        if (!refreshed.ok) {
          clearAdminSession()
          return response
        }
        const tokens = (await refreshed.json()) as { access_token: string; refresh_token: string }
        localStorage.setItem(ACCESS_KEY, tokens.access_token)
        localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
        request.headers.set('Authorization', `Bearer ${tokens.access_token}`)
        return ky(request)
      },
    ],
  },
})

export async function adminFetch<T>(path: string, options?: Parameters<typeof adminApi>[1]): Promise<T> {
  const response = await adminApi(path, options)
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `HTTP ${response.status}`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}
