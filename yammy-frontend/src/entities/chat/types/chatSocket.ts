import type { ChatWsEvent } from '../lib/chatWsEvents'

export type ChatWsEnvelope<T = unknown> = {
  event: ChatWsEvent
  data: T
}

export type ChatWsErrorData = {
  status_code: number
  detail: string
}

export type ChatWsPeer = {
  id: string
  name: string
  age: number
  main_photo: string
  last_seen: string
}

export type ChatMessageDto = {
  id: string
  content: string
  created_at: string
  updated_at: string | null
  is_read: boolean
  is_edited: boolean
  is_deleted: boolean
  sender: {
    id: string
    name: string
    main_photo?: string | null
  }
  reply_to?: ChatMessageDto | null
  images: Array<{
    id: string
    file_path: string
    order: number
  }>
}

export type ChatOpenData = {
  id: string
  match_id: string
  created_at: string
  user_to: ChatWsPeer
  messages: ChatMessageDto[]
}
