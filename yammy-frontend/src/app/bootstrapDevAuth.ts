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
  refresh_token: string
}

/**
 * В `development` бэкенд отдаёт JWT через заглушку Telegram (`ENVIRONMENT=development`):
 * берётся **первый пользователь в БД** (минимальный `id`), без реального `init_data`.
 *
 * **После сноса БД:** в `localStorage` часто остаются JWT со `sub` = удалённый `user_id` →
 * все запросы и refresh дают 401. Поэтому в DEV **всегда** заново дергаем stub при старте приложения
 * и подменяем токены; если в БД нет ни одного пользователя — чистим токены и пишем в консоль.
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
        '— токены очищены. Если БД пустая, создай пользователя (сид/миграции).',
      )
      return
    }
    const data = (await response.json()) as TelegramTokenResponse
    setAccessToken(data.access_token)
    setRefreshToken(data.refresh_token)
  } catch (error) {
    deleteAccessToken()
    deleteRefreshToken()
    console.warn('[dev] stub auth error — токены очищены', error)
  }
}
