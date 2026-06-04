import { loginTelegram } from '@/entities/auth/api/authService'
import { deleteAccessToken, deleteRefreshToken } from '@/entities/token/lib/tokenService'

import { ensureDevAuthToken } from './bootstrapDevAuth'
import { ensureDevOnboardingToken } from './bootstrapDevOnboarding'

function getTelegramInitData(): string | null {
  const tg = (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp
  const initData = tg?.initData?.trim()
  return initData || null
}

export async function ensureAppAuth(): Promise<void> {
  if (import.meta.env.DEV) {
    // В dev всегда заглушка / dev/onboarding — не loginTelegram(initData): в TMA initData
    // часто без hash, а при ENVIRONMENT=production бэк отвечает 400.
    if (import.meta.env.VITE_DEV_AUTH === 'onboarding') {
      await ensureDevOnboardingToken()
      return
    }

    await ensureDevAuthToken()
    return
  }

  const initData = getTelegramInitData()
  if (!initData) {
    deleteAccessToken()
    deleteRefreshToken()
    return
  }

  try {
    await loginTelegram(initData)
  } catch (error) {
    deleteAccessToken()
    deleteRefreshToken()
    console.warn('[auth] telegram login failed', error)
  }
}
