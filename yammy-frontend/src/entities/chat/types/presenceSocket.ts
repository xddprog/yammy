import type { PresenceWsEvent } from '../lib/presenceWsEvents'

export type PresencePeerStateDto = {
  user_id: string
  online: boolean
}

export type PresenceSnapshotData = {
  peers: PresencePeerStateDto[]
}

export type PresenceUpdateData = {
  user_id: string
  online: boolean
  at: string
}

export type PresenceErrorData = {
  status_code: number
  detail: string
}

export type PresenceSubscribePayload = {
  peer_ids: string[]
}

export type PresenceWsEnvelope<T = unknown> = {
  event: PresenceWsEvent
  data: T
}
