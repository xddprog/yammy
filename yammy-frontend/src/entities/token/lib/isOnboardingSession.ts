import { getAccessToken } from './tokenService'

const ONBOARDING_SCOPE = 'onboarding'

type JwtPayload = {
  scope?: unknown
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const payload = token.split('.')[1]
  if (!payload) {
    return null
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    )
    return JSON.parse(atob(paddedPayload)) as JwtPayload
  } catch {
    return null
  }
}

/** Онбординг определяется scope в access JWT, а не наличием refresh token. */
export function isOnboardingSession(): boolean {
  const token = getAccessToken()
  if (!token) {
    return false
  }

  return decodeJwtPayload(token)?.scope === ONBOARDING_SCOPE
}
