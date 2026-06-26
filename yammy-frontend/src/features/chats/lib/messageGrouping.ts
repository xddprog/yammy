import type { ChatMessage } from '@/entities/chat'
import { formatMessageTimestamp } from '@/entities/chat/lib/mapChatMessage'

export type MessageGroupPosition = 'single' | 'first' | 'middle' | 'last'

export interface MessageLayoutMeta {
  groupPosition: MessageGroupPosition
  showTimestamp: boolean
  isGroupedWithPrev: boolean
  displayTimestamp: string
}

function getMinuteKey(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function canGroupMessages(previous: ChatMessage, current: ChatMessage): boolean {
  if (previous.senderId !== current.senderId) {
    return false
  }
  return getMinuteKey(previous.createdAt) === getMinuteKey(current.createdAt)
}

export function buildMessageLayoutMeta(messages: ChatMessage[]): MessageLayoutMeta[] {
  return messages.map((message, index) => {
    const previous = index > 0 ? messages[index - 1] : null
    const next = index < messages.length - 1 ? messages[index + 1] : null

    const isGroupedWithPrev = previous ? canGroupMessages(previous, message) : false
    const isGroupedWithNext = next ? canGroupMessages(message, next) : false

    let groupPosition: MessageGroupPosition
    if (!isGroupedWithPrev && !isGroupedWithNext) {
      groupPosition = 'single'
    } else if (!isGroupedWithPrev && isGroupedWithNext) {
      groupPosition = 'first'
    } else if (isGroupedWithPrev && isGroupedWithNext) {
      groupPosition = 'middle'
    } else {
      groupPosition = 'last'
    }

    const showTimestamp = !isGroupedWithNext
    const displayTimestamp = showTimestamp
      ? groupPosition === 'single'
        ? formatMessageTimestamp(message.createdAt)
        : formatMessageTime(message.createdAt)
      : ''

    return {
      groupPosition,
      showTimestamp,
      isGroupedWithPrev,
      displayTimestamp,
    }
  })
}
