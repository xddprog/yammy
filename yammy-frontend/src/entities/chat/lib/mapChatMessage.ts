import type { ChatMessageDto } from '../types/chatSocket'
import type { ChatMessage } from '../types/message'

function formatMessageTimestamp(iso: string): string {
  const date = new Date(iso)
  const now = new Date()

  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return 'Вчера'
  }

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  })
}

export function mapMessageDtoToChatMessage(dto: ChatMessageDto, currentUserId: string): ChatMessage {
  const isMe = dto.sender.id === currentUserId

  return {
    id: dto.id,
    text: dto.content,
    images: dto.images.length > 0 ? dto.images.map((image) => image.file_path) : undefined,
    senderId: isMe ? 'me' : 'other',
    timestamp: formatMessageTimestamp(dto.created_at),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    isRead: dto.is_read,
    isEdited: dto.is_edited,
    isDeleted: Boolean(dto.is_deleted),
    replyToId: dto.reply_to?.id,
    replyToText: dto.reply_to?.content,
    replyToName: dto.reply_to?.sender?.name,
  }
}
