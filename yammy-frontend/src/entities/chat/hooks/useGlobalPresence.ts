import { useEffect, useRef } from 'react'

import { getAccessToken } from '@/entities'

import { buildPresenceWebSocketUrl } from '../lib/buildPresenceWebSocketUrl'
import { PRESENCE_WS_EVENTS } from '../lib/presenceWsEvents'
import type {
  PresenceSnapshotData,
  PresenceUpdateData,
  PresenceWsEnvelope,
} from '../types/presenceSocket'

type PresenceContextBridge = {
  subscribedPeerIds: string[]
  setPeerPresence: (userId: string, online: boolean, at?: string | null) => void
  applySnapshot: (entries: Array<{ user_id: string; online: boolean }>) => void
}

const HEARTBEAT_INTERVAL_MS = 25_000
const RECONNECT_DELAY_MS = 1_500

export function useGlobalPresence(presence: PresenceContextBridge): void {
  const presenceRef = useRef(presence)
  const websocketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const heartbeatTimerRef = useRef<number | null>(null)
  const closedByUsRef = useRef(false)
  const connectRef = useRef<() => void>(() => {})

  presenceRef.current = presence

  useEffect(() => {
    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }

    const clearHeartbeatTimer = () => {
      if (heartbeatTimerRef.current != null) {
        window.clearInterval(heartbeatTimerRef.current)
        heartbeatTimerRef.current = null
      }
    }

    const sendHeartbeat = () => {
      if (websocketRef.current?.readyState !== WebSocket.OPEN) {
        return
      }

      websocketRef.current.send(
        JSON.stringify({
          event: PRESENCE_WS_EVENTS.HEARTBEAT,
        }),
      )
    }

    const sendCurrentSubscriptions = () => {
      if (websocketRef.current?.readyState !== WebSocket.OPEN) {
        return
      }

      websocketRef.current.send(
        JSON.stringify({
          event: PRESENCE_WS_EVENTS.SUBSCRIBE_PEERS,
          peer_ids: presenceRef.current.subscribedPeerIds,
        }),
      )
    }

    const disconnect = () => {
      closedByUsRef.current = true
      clearReconnectTimer()
      clearHeartbeatTimer()

      const websocket = websocketRef.current
      websocketRef.current = null
      if (websocket && websocket.readyState < WebSocket.CLOSING) {
        websocket.close()
      }
    }

    const connect = () => {
      if (document.visibilityState === 'hidden') {
        return
      }
      if (!getAccessToken()) {
        return
      }
      if (websocketRef.current && websocketRef.current.readyState < WebSocket.CLOSING) {
        return
      }

      const url = buildPresenceWebSocketUrl()
      if (!url) {
        return
      }

      closedByUsRef.current = false
      const websocket = new WebSocket(url)
      websocketRef.current = websocket

      websocket.onopen = () => {
        clearReconnectTimer()
        clearHeartbeatTimer()
        sendCurrentSubscriptions()
        sendHeartbeat()
        heartbeatTimerRef.current = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
      }

      websocket.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data as string) as PresenceWsEnvelope
          if (envelope.event === PRESENCE_WS_EVENTS.PRESENCE_SNAPSHOT) {
            const data = envelope.data as PresenceSnapshotData
            presenceRef.current.applySnapshot(data.peers ?? [])
            return
          }

          if (envelope.event === PRESENCE_WS_EVENTS.PRESENCE_UPDATE) {
            const data = envelope.data as PresenceUpdateData
            presenceRef.current.setPeerPresence(data.user_id, data.online, data.at)
          }
        } catch {
          // ignore malformed presence payloads
        }
      }

      websocket.onclose = () => {
        if (websocketRef.current === websocket) {
          websocketRef.current = null
        }
        clearHeartbeatTimer()

        if (!closedByUsRef.current && document.visibilityState === 'visible' && getAccessToken()) {
          clearReconnectTimer()
          reconnectTimerRef.current = window.setTimeout(() => {
            connectRef.current()
          }, RECONNECT_DELAY_MS)
        }
      }
    }

    connectRef.current = connect

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        disconnect()
        return
      }

      connectRef.current()
    }

    connect()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      disconnect()
    }
  }, [])

  useEffect(() => {
    if (websocketRef.current?.readyState !== WebSocket.OPEN) {
      return
    }

    websocketRef.current.send(
      JSON.stringify({
        event: PRESENCE_WS_EVENTS.SUBSCRIBE_PEERS,
        peer_ids: presence.subscribedPeerIds,
      }),
    )
  }, [presence.subscribedPeerIds])
}
