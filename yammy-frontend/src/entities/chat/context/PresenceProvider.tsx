import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useGlobalPresence } from '../hooks/useGlobalPresence'

type PresenceState = {
  online: boolean
  lastSeenAt: string | null
}

export type PresenceContextValue = {
  getPeerState: (userId?: string | null, fallbackLastSeen?: string | null) => PresenceState
  registerPeerIds: (peerIds: string[]) => () => void
}

export const PresenceContext = createContext<PresenceContextValue | null>(null)

export const PresenceProvider = ({ children }: PropsWithChildren) => {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceState>>(new Map())
  const [subscribedPeerIds, setSubscribedPeerIds] = useState<string[]>([])
  const subscriptionsRef = useRef<Map<string, number>>(new Map())

  const syncSubscriptions = useCallback(() => {
    setSubscribedPeerIds(Array.from(subscriptionsRef.current.keys()).sort())
  }, [])

  const registerPeerIds = useCallback(
    (peerIds: string[]) => {
      const normalizedPeerIds = Array.from(
        new Set(peerIds.map((peerId) => peerId.trim()).filter(Boolean)),
      )

      normalizedPeerIds.forEach((peerId) => {
        const currentCount = subscriptionsRef.current.get(peerId) ?? 0
        subscriptionsRef.current.set(peerId, currentCount + 1)
      })
      syncSubscriptions()

      return () => {
        normalizedPeerIds.forEach((peerId) => {
          const currentCount = subscriptionsRef.current.get(peerId) ?? 0
          if (currentCount <= 1) {
            subscriptionsRef.current.delete(peerId)
            return
          }
          subscriptionsRef.current.set(peerId, currentCount - 1)
        })
        syncSubscriptions()
      }
    },
    [syncSubscriptions],
  )

  const setPeerPresence = useCallback((userId: string, online: boolean, at?: string | null) => {
    setPresenceMap((prev) => {
      const next = new Map(prev)
      const previous = next.get(userId)
      next.set(userId, {
        online,
        lastSeenAt: online ? (previous?.lastSeenAt ?? null) : (at ?? previous?.lastSeenAt ?? null),
      })
      return next
    })
  }, [])

  const applySnapshot = useCallback((entries: Array<{ user_id: string; online: boolean }>) => {
    setPresenceMap((prev) => {
      const next = new Map(prev)
      entries.forEach((entry) => {
        const previous = next.get(entry.user_id)
        next.set(entry.user_id, {
          online: entry.online,
          lastSeenAt: previous?.lastSeenAt ?? null,
        })
      })
      return next
    })
  }, [])

  useGlobalPresence({
    subscribedPeerIds,
    setPeerPresence,
    applySnapshot,
  })

  const getPeerState = useCallback(
    (userId?: string | null, fallbackLastSeen?: string | null): PresenceState => {
      if (!userId) {
        return { online: false, lastSeenAt: fallbackLastSeen ?? null }
      }

      const state = presenceMap.get(userId)
      return {
        online: state?.online ?? false,
        lastSeenAt: state?.lastSeenAt ?? fallbackLastSeen ?? null,
      }
    },
    [presenceMap],
  )

  const value = useMemo<PresenceContextValue>(
    () => ({
      getPeerState,
      registerPeerIds,
    }),
    [getPeerState, registerPeerIds],
  )

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}
