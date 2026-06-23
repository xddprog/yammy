import { loginTelegram } from '@/entities/auth/api/authService'
import {
  deleteAccessToken,
  deleteRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/entities/token/lib/tokenService'
import { publicApi } from '@/shared/api/baseQueryInstanse'

import { ensureDevAuthToken } from './bootstrapDevAuth'
import { ensureDevOnboardingToken } from './bootstrapDevOnboarding'
import { loadTelegramWebAppScript } from './providers/loadTelegramWebAppScript'
import { readTelegramInitDataFromLaunch } from './providers/readTelegramInitData'

type TokenPair = {
  access_token: string
  refresh_token: string
}

const INIT_DATA_POLL_MS = 100
const INIT_DATA_POLL_ATTEMPTS = 50

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

async function waitForTelegramInitData(): Promise<string | null> {
  let initData = readTelegramInitDataFromLaunch()
  if (initData) {
    return initData
  }

  try {
    await loadTelegramWebAppScript()
  } catch {
    return readTelegramInitDataFromLaunch()
  }

  for (let attempt = 0; attempt < INIT_DATA_POLL_ATTEMPTS; attempt += 1) {
    initData = readTelegramInitDataFromLaunch()
    if (initData) {
      return initData
    }
    await new Promise((resolve) => window.setTimeout(resolve, INIT_DATA_POLL_MS))
  }

  return readTelegramInitDataFromLaunch()
}

export async function ensureAppAuth(): Promise<void> {
  if (import.meta.env.DEV) {
    if (await tryRestoreSessionFromRefresh()) {
      return
    }

    deleteAccessToken()
    deleteRefreshToken()

    if (import.meta.env.VITE_DEV_AUTH === 'onboarding') {
      await ensureDevOnboardingToken()
      return
    }

    await ensureDevAuthToken()
    return
  }

  if (await tryRestoreSessionFromRefresh()) {
    return
  }

  const existingAccess = getAccessToken()
  const initData = await waitForTelegramInitData()

  if (initData) {
    try {
      await loginTelegram(initData)
    } catch (error) {
      if (!existingAccess) {
        deleteAccessToken()
        deleteRefreshToken()
      }
      console.warn('[auth] telegram login failed', error)
    }
    return
  }

  if (existingAccess) {
    return
  }

  deleteAccessToken()
  deleteRefreshToken()
}
