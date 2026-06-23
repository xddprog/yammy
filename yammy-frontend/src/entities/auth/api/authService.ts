import { authApi, publicApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'
import { compressImageForUpload } from '@/shared/lib/compressImageForUpload'
import { readTelegramInitDataFromLaunch, rememberTelegramInitData } from '@/app/providers/readTelegramInitData'
import { isOnboardingSession } from '@/entities/token/lib/isOnboardingSession'
import {
  deleteRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/entities/token/lib/tokenService'

import type { UserUpdateRequestDto } from '@/entities/user/types/types'

import type { CurrentUser } from '../types/types'

const CURRENT_USER_ENDPOINT = 'api/v1/auth/current_user'
const TELEGRAM_LOGIN_ENDPOINT = 'api/v1/auth/telegram'
const ONBOARDING_FINISH_ENDPOINT = 'api/v1/auth/onboarding/finish'
/** Загрузка фото с телефона через ngrok может занимать несколько минут. */
const ONBOARDING_FINISH_TIMEOUT_MS = 300_000

type TokenPair = {
  access_token: string
  refresh_token?: string | null
}

function applyTokenPair(data: TokenPair): void {
  if (!data.access_token?.trim()) {
    throw new Error('Сервер не вернул access token')
  }
  setAccessToken(data.access_token)
  if (data.refresh_token) {
    setRefreshToken(data.refresh_token)
  } else {
    deleteRefreshToken()
  }
}

async function loginTelegramWithInitData(initData: string): Promise<TokenPair> {
  rememberTelegramInitData(initData)
  const response = await publicApi.post(TELEGRAM_LOGIN_ENDPOINT, {
    json: { init_data: initData },
  })
  if (!response.ok) {
    await throwApiError(response, 'Ошибка входа через Telegram')
  }
  const data = (await response.json()) as TokenPair
  applyTokenPair(data)
  return data
}

export class AuthService {
  public async loginTelegram(initData: string): Promise<TokenPair> {
    return loginTelegramWithInitData(initData)
  }

  /** Профиль + фото одним запросом, в ответе полные JWT. */
  public async finishOnboarding(
    profile: UserUpdateRequestDto & {
      photos: { order: number; is_main: boolean }[]
    },
    images: File[],
  ): Promise<TokenPair> {
    const formData = new FormData()
    formData.append('profile', JSON.stringify(profile))
    const preparedImages = await Promise.all(images.map((file) => compressImageForUpload(file)))
    for (const file of preparedImages) {
      formData.append('images', file)
    }

    const response = await authApi.post(ONBOARDING_FINISH_ENDPOINT, {
      body: formData,
      timeout: ONBOARDING_FINISH_TIMEOUT_MS,
    })
    if (response.status === 409) {
      const initData = readTelegramInitDataFromLaunch()
      if (initData) {
        return loginTelegramWithInitData(initData)
      }
    }
    if (!response.ok) {
      await throwApiError(response, 'Регистрация')
    }
    const data = (await response.json()) as TokenPair
    applyTokenPair(data)
    if (isOnboardingSession()) {
      const initData = readTelegramInitDataFromLaunch()
      if (!initData) {
        throw new Error('Не удалось обновить сессию после регистрации')
      }
      return loginTelegramWithInitData(initData)
    }
    return data
  }

  public async getCurrentUser(): Promise<CurrentUser> {
    const response = await authApi.get(CURRENT_USER_ENDPOINT)

    if (!response.ok) {
      await throwApiError(response, 'Ошибка получения пользователя')
    }

    return response.json() as Promise<CurrentUser>
  }
}

export const authService = new AuthService()
export const { getCurrentUser, loginTelegram, finishOnboarding } = authService
