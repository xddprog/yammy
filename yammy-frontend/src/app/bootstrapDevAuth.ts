import { getAccessToken, setAccessToken, setRefreshToken } from '@/entities'
import { publicApi } from '@/shared/api/baseQueryInstanse'

const TELEGRAM_STUB_LOGIN = 'api/v1/auth/telegram'

type TelegramTokenResponse = {
  access_token: string
  refresh_token: string
}

/**
 * В `development` бэкенд отдаёт JWT через заглушку Telegram без реального init_data.
 * Без токена фронт раньше слал `Bearer 123` → всегда 401. Стартуем с реальными токенами из localStorage или stub-login.
 */
export async function ensureDevAuthToken(): Promise<void> {
  if (!import.meta.env.DEV) {
    return
  }
  if (getAccessToken()) {
    return
  }

  try {
    const response = await publicApi.post(TELEGRAM_STUB_LOGIN, {
      json: { init_data: '' },
    })
    if (!response.ok) {
      console.warn('[dev] stub auth failed', response.status)
      return
    }
    const data = (await response.json()) as TelegramTokenResponse
    setAccessToken(data.access_token)
    setRefreshToken(data.refresh_token)
  } catch (error) {
    console.warn('[dev] stub auth error', error)
  }
}
