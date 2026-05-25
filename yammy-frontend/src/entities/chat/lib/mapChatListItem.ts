import type { ChatListItem, ChatListItemDto } from '../types/types'
import { formatChatListTimestamp } from './formatChatListTimestamp'

const CHAT_AVATAR_FALLBACK = '/images/i.webp'

export function mapChatListItem(dto: ChatListItemDto): ChatListItem {
  const timestamp = dto.last_message
    ? formatChatListTimestamp(dto.last_message.created_at)
    : ''

  return {
    id: dto.match_id,
    name: dto.peer.name,
    age: dto.peer.age,
    lastMessage: dto.last_message?.content ?? '',
    avatar: dto.peer.main_photo ?? CHAT_AVATAR_FALLBACK,
    timestamp,
    unreadCount: dto.unread_count,
  }
}
