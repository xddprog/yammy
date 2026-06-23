import { LocalStorageKeys } from '@/shared'

import { notifyAuthSessionChanged } from './authSessionStore'

class TokenService {
  public setAccessToken(accessToken: string): void {
    localStorage.setItem(LocalStorageKeys.ACCESS_TOKEN, accessToken)
    notifyAuthSessionChanged()
  }

  public deleteAccessToken(): void {
    localStorage.removeItem(LocalStorageKeys.ACCESS_TOKEN)
    notifyAuthSessionChanged()
  }

  public getAccessToken(): string | null {
    return localStorage.getItem(LocalStorageKeys.ACCESS_TOKEN)
  }

  public setRefreshToken(refreshToken: string): void {
    localStorage.setItem(LocalStorageKeys.REFRESH_TOKEN, refreshToken)
    notifyAuthSessionChanged()
  }

  public deleteRefreshToken(): void {
    localStorage.removeItem(LocalStorageKeys.REFRESH_TOKEN)
    notifyAuthSessionChanged()
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(LocalStorageKeys.REFRESH_TOKEN)
  }
}

export const {
  deleteAccessToken,
  getAccessToken,
  setAccessToken,
  deleteRefreshToken,
  getRefreshToken,
  setRefreshToken,
} = new TokenService()
