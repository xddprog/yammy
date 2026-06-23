import { useSyncExternalStore } from 'react'

import { isOnboardingSession } from '../lib/isOnboardingSession'
import { subscribeAuthSession } from '../lib/authSessionStore'
import { getAccessToken } from '../lib/tokenService'

function readAuthSessionSnapshot(): { hasToken: boolean; isOnboarding: boolean } {
  return {
    hasToken: Boolean(getAccessToken()),
    isOnboarding: isOnboardingSession(),
  }
}

/** Реактивное чтение JWT — AppAuthGate обновляется сразу после finish/login. */
export function useAuthSession(): { hasToken: boolean; isOnboarding: boolean } {
  return useSyncExternalStore(subscribeAuthSession, readAuthSessionSnapshot, readAuthSessionSnapshot)
}
