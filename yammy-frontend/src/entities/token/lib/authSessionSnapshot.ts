import { isOnboardingSession } from './isOnboardingSession'
import { getAccessToken } from './tokenService'

export type AuthSessionSnapshot = {
  hasToken: boolean
  isOnboarding: boolean
}

let cachedSnapshot: AuthSessionSnapshot = {
  hasToken: false,
  isOnboarding: false,
}

/** useSyncExternalStore требует стабильную ссылку, пока данные не изменились. */
export function readAuthSessionSnapshot(): AuthSessionSnapshot {
  const hasToken = Boolean(getAccessToken())
  const isOnboarding = isOnboardingSession()

  if (cachedSnapshot.hasToken === hasToken && cachedSnapshot.isOnboarding === isOnboarding) {
    return cachedSnapshot
  }

  cachedSnapshot = { hasToken, isOnboarding }
  return cachedSnapshot
}
