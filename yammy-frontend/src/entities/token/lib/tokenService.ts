import { LocalStorageKeys } from '@/shared'

class TokenService {
  public setAccessToken(accessToken: string): void {
    localStorage.setItem(LocalStorageKeys.ACCESS_TOKEN, accessToken)
  }

  public deleteAccessToken(): void {
    localStorage.removeItem(LocalStorageKeys.ACCESS_TOKEN)
  }

  public getAccessToken(): string | null {
    return localStorage.getItem(LocalStorageKeys.ACCESS_TOKEN)
  }

  public setRefreshToken(refreshToken: string): void {
    localStorage.setItem(LocalStorageKeys.REFRESH_TOKEN, refreshToken)
  }

  public deleteRefreshToken(): void {
    localStorage.removeItem(LocalStorageKeys.REFRESH_TOKEN)
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
