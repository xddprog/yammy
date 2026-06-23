import { useSyncExternalStore } from 'react'

import { readAuthSessionSnapshot } from '../lib/authSessionSnapshot'
import { subscribeAuthSession } from '../lib/authSessionStore'

/** Реактивное чтение JWT — AppAuthGate обновляется сразу после finish/login. */
export function useAuthSession(): { hasToken: boolean; isOnboarding: boolean } {
  return useSyncExternalStore(subscribeAuthSession, readAuthSessionSnapshot, readAuthSessionSnapshot)
}
