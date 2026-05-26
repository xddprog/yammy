import { useContext, useEffect, useMemo } from 'react'

import { PresenceContext } from '../context/PresenceProvider'

export function usePresence() {
  const context = useContext(PresenceContext)
  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider')
  }
  return context
}

export function usePresenceSubscription(peerIds: string[]): void {
  const { registerPeerIds } = usePresence()
  const normalizedPeerIds = useMemo(
    () => Array.from(new Set(peerIds.map((peerId) => peerId.trim()).filter(Boolean))).sort(),
    [peerIds],
  )

  useEffect(() => registerPeerIds(normalizedPeerIds), [registerPeerIds, normalizedPeerIds])
}
