export const PRESENCE_WS_EVENTS = {
  ERROR: 'error',
  HEARTBEAT: 'heartbeat',
  SUBSCRIBE_PEERS: 'subscribe_peers',
  PRESENCE_SNAPSHOT: 'presence_snapshot',
  PRESENCE_UPDATE: 'presence_update',
} as const

export type PresenceWsEvent = (typeof PRESENCE_WS_EVENTS)[keyof typeof PRESENCE_WS_EVENTS]
