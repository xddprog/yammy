import {
  deleteAccessToken,
  deleteRefreshToken,
  setAccessToken,
} from '@/entities'

import { publicApi } from '@/shared/api/baseQueryInstanse'

const DEV_ONBOARDING_ENDPOINT = 'api/v1/auth/dev/onboarding'

const DEFAULT_DEV_TELEGRAM_ID = 1_212_345_678

function devOnboardingTelegramId(): number {
  const raw = import.meta.env.VITE_DEV_ONBOARDING_TELEGRAM_ID
  if (!raw) {
    return DEFAULT_DEV_TELEGRAM_ID
  }
  const id = Number.parseInt(String(raw), 10)
  return Number.isFinite(id) && id > 0 ? id : DEFAULT_DEV_TELEGRAM_ID
}

/**
 * Dev-only: onboarding JWT (без refresh) для telegram_id, которого ещё нет в БД.
 */
export async function ensureDevOnboardingToken(): Promise<void> {
  if (!import.meta.env.DEV) {
    return
  }

  try {
    const response = await publicApi.post(DEV_ONBOARDING_ENDPOINT, {
      json: { telegram_id: devOnboardingTelegramId() },
    })
    if (!response.ok) {
      deleteAccessToken()
      deleteRefreshToken()
      const text = await response.text().catch(() => '')
      console.warn('[dev] onboarding token failed', response.status, text?.slice(0, 300))
      return
    }
    const data = (await response.json()) as { access_token: string }
    setAccessToken(data.access_token)
    deleteRefreshToken()
  } catch (error) {
    deleteAccessToken()
    deleteRefreshToken()
    console.warn('[dev] onboarding token error', error)
  }
}
