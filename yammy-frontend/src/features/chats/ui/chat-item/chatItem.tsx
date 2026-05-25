import { memo } from 'react'

import type { ChatListItem } from '@/entities/chat'

interface ChatItemProps {
  chat: ChatListItem
  /** Позже — из WS (inbox), не из GET /chats/ */
  isTyping?: boolean
  onClick?: () => void
}

const ChatItemComponent = ({ chat, isTyping = false, onClick }: ChatItemProps) => {
  const { name, age, lastMessage, avatar, timestamp, unreadCount } = chat

  const title = age !== undefined ? `${name}, ${age}` : name
  const previewText = isTyping ? 'печатает…' : lastMessage

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[28px] bg-[#111111] px-4 py-3.5 text-left transition-transform active:scale-[0.99]"
    >
      <div className="relative h-[52px] w-[52px] shrink-0">
        <div className="h-full w-full overflow-hidden rounded-full bg-muted">
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        </div>
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
            className={`min-w-0 flex-1 truncate text-[13px] font-[100] ${isTyping ? 'text-[#FF6BA4]' : 'text-muted-foreground'}`}
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
