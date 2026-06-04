import { isOnboardingSession } from '@/entities/token/lib/isOnboardingSession'

import { authApi } from './baseQueryInstanse'
import { throwApiError } from './handleApiError'

export async function fetchCityNames(q: string, limit: number): Promise<string[]> {
  const path = isOnboardingSession()
    ? 'api/v1/auth/onboarding/cities'
    : 'api/v1/cities'
  const response = await authApi.get(path, {
    searchParams: { q, limit: String(limit) },
  })

  if (!response.ok) {
    await throwApiError(response, 'Города')
  }

  const data = (await response.json()) as unknown
  return Array.isArray(data) ? (data as string[]) : []
}
