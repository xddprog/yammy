import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'

import type { CurrentUser } from '../types/types'

const CURRENT_USER_ENDPOINT = 'api/v1/auth/current_user'

export class AuthService {
  public async getCurrentUser(): Promise<CurrentUser> {
    const response = await authApi.get(CURRENT_USER_ENDPOINT)

    if (!response.ok) {
      await throwApiError(response, 'Ошибка получения пользователя')
    }

    return response.json() as Promise<CurrentUser>
  }
}

export const authService = new AuthService()
export const { getCurrentUser } = authService
