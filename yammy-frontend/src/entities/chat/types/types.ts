export type ChatPeerDto = {
  user_id: string
  name: string
  age: number
  is_banned: boolean
  main_photo: string | null
  last_seen: string
}

export type ChatLastMessageDto = {
  content: string
  created_at: string
}

export type ChatListItemDto = {
  match_id: string
  chat_id: string | null
  peer: ChatPeerDto
  last_message: ChatLastMessageDto | null
  unread_count: number
}

export type ChatListItem = {
  id: string
  peerId: string
  name: string
  age: number
  isBanned: boolean
  lastMessage: string
  avatar: string
  timestamp: string
  unreadCount: number
  lastSeen: string
}
