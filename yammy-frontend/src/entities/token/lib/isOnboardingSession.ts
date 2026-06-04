import { getAccessToken, getRefreshToken } from './tokenService'

/** Полная сессия — есть refresh; онбординг — только короткий access JWT. */
export function isOnboardingSession(): boolean {
  return Boolean(getAccessToken()) && !getRefreshToken()
}
