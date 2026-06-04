import {
  deleteAccessToken,
  deleteRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/entities'
import { publicApi } from '@/shared/api/baseQueryInstanse'

const TELEGRAM_STUB_LOGIN = 'api/v1/auth/telegram'

type TelegramTokenResponse = {
  access_token: string
  refresh_token?: string | null
}

/**
 * Dev: POST /auth/telegram (заглушка) — нет users с `TELEGRAM_CONFIG__DEV_STUB_TELEGRAM_ID`
 * → onboarding access без refresh; есть пользователь → полные JWT.
 */
export async function ensureDevAuthToken(): Promise<void> {
  if (!import.meta.env.DEV) {
    return
  }

  try {
    const response = await publicApi.post(TELEGRAM_STUB_LOGIN, {
      json: { init_data: '' },
    })
    if (!response.ok) {
      deleteAccessToken()
      deleteRefreshToken()
      const text = await response.text().catch(() => '')
      console.warn(
        '[dev] stub auth failed',
        response.status,
        text?.slice(0, 200),
        '— токены очищены. Нужен APP_CONFIG__ENVIRONMENT=development на бэке (и перезапуск uvicorn). Для онбординга удали user с TELEGRAM_CONFIG__DEV_STUB_TELEGRAM_ID.',
      )
      return
    }
    const data = (await response.json()) as TelegramTokenResponse
    setAccessToken(data.access_token)
    if (data.refresh_token) {
      setRefreshToken(data.refresh_token)
    } else {
      deleteRefreshToken()
    }
  } catch (error) {
    deleteAccessToken()
    deleteRefreshToken()
    console.warn('[dev] stub auth error — токены очищены', error)
  }
}
