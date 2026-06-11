import { loginTelegram } from '@/entities/auth/api/authService'
import {
  deleteAccessToken,
  deleteRefreshToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/entities/token/lib/tokenService'
import { publicApi } from '@/shared/api/baseQueryInstanse'

import { ensureDevAuthToken } from './bootstrapDevAuth'
import { ensureDevOnboardingToken } from './bootstrapDevOnboarding'
import { loadTelegramWebAppScript } from './providers/loadTelegramWebAppScript'

type TokenPair = {
  access_token: string
  refresh_token: string
}

async function tryRestoreSessionFromRefresh(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) {
    return false
  }

  const response = await publicApi.post('api/v1/auth/refresh', {
    json: { refresh_token: refresh },
  })

  if (!response.ok) {
    return false
  }

  const data = (await response.json()) as TokenPair
  if (!data.access_token || !data.refresh_token) {
    return false
  }

  setAccessToken(data.access_token)
  setRefreshToken(data.refresh_token)
  return true
}

async function getTelegramInitData(): Promise<string | null> {
  const currentInitData = (
    window as Window & { Telegram?: { WebApp?: { initData?: string } } }
  ).Telegram?.WebApp?.initData?.trim()
  if (currentInitData) {
    return currentInitData
  }

  try {
    await loadTelegramWebAppScript()
  } catch {
    return null
  }

  const tg = (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp
  const initData = tg?.initData?.trim()
  return initData || null
}

export async function ensureAppAuth(): Promise<void> {
  if (import.meta.env.DEV) {
    if (await tryRestoreSessionFromRefresh()) {
      return
    }

    deleteAccessToken()
    deleteRefreshToken()

    // В dev всегда заглушка / dev/onboarding — не loginTelegram(initData): в TMA initData
    // часто без hash, а при ENVIRONMENT=production бэк отвечает 400.
    if (import.meta.env.VITE_DEV_AUTH === 'onboarding') {
      await ensureDevOnboardingToken()
      return
    }

    await ensureDevAuthToken()
    return
  }

  const initData = await getTelegramInitData()
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
