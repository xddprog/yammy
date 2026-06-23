import { memo } from 'react'

import { formatLastSeenLabel, type ChatListItem } from '@/entities/chat'
import { Image } from '@/shared'

const CHAT_AVATAR_FALLBACK = '/images/i.webp'

interface ChatItemProps {
  chat: ChatListItem
  /** Позже — из WS (inbox), не из GET /chats/ */
  isTyping?: boolean
  online?: boolean
  lastSeen?: string | null
  onClick?: () => void
}

const ChatItemComponent = ({
  chat,
  isTyping = false,
  online = false,
  lastSeen,
  onClick,
}: ChatItemProps) => {
  const { name, age, isBanned, lastMessage, avatar, timestamp, unreadCount } = chat

  const displayName = isBanned ? 'Аккаунт забанен' : name
  const title = !isBanned && age !== undefined ? `${displayName}, ${age}` : displayName
  const fallbackStatus = online ? 'в сети' : formatLastSeenLabel(lastSeen)
  const previewText = isTyping ? 'печатает…' : lastMessage || fallbackStatus
  const showPresencePreview = !isTyping && !lastMessage

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[28px] bg-[#111111] px-4 py-3.5 text-left transition-transform active:scale-[0.99]"
    >
      <div className="relative h-[52px] w-[52px] shrink-0">
        <div className="h-full w-full overflow-hidden rounded-full bg-muted">
          <Image
            src={avatar || CHAT_AVATAR_FALLBACK}
            alt=""
            fallbackSrc={CHAT_AVATAR_FALLBACK}
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
        {online && (
          <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-[#111111] bg-[#FF6BA4]" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex w-full items-start justify-between gap-2">
          <span className="truncate text-[16px] font-[200] tracking-tight text-card-foreground">
            {title}
          </span>
          <span className="shrink-0 text-[13px] font-[200] text-muted-foreground">{timestamp}</span>
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <p
            className={`min-w-0 flex-1 truncate text-[13px] font-[100] ${
              isTyping || (showPresencePreview && online)
                ? 'text-[#FF6BA4]'
                : 'text-muted-foreground'
            }`}
          >
            {previewText}
          </p>
          {unreadCount > 0 && (
            <div className="flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full bg-[#FF6BA4] px-2 text-[11px] font-bold text-white">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export const ChatItem = memo(ChatItemComponent)
