import { memo } from 'react'

import type { MockChat } from '@/pages/(main)/chatsPage/lib/mockChats'

interface ChatItemProps {
  chat: MockChat
  onClick?: () => void
}

const ChatItemComponent = ({ chat, onClick }: ChatItemProps) => {
  const { name, lastMessage, avatar, timestamp, unreadCount, online } = chat

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl p-3 transition-all hover:bg-muted/30 active:scale-[0.98] active:bg-muted/50"
    >
      <div className="relative h-14 w-14 shrink-0">
        <div className="h-full w-full overflow-hidden rounded-full border border-white/5">
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        </div>
        {online && (
          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <div className="flex w-full items-center justify-between">
          <span className="truncate text-[16px] font-semibold text-foreground">{name}</span>
          <span className="text-[12px] font-medium text-muted-foreground/60">{timestamp}</span>
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <p className="truncate text-[14px] font-light leading-tight text-muted-foreground/70">
            {lastMessage}
          </p>
          {unreadCount > 0 && (
            <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF6BA4] px-1.5 text-[10px] font-bold leading-none text-white shadow-lg shadow-[#FF6BA4]/20">
              <span className="flex items-center justify-center pt-[1px]">{unreadCount}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export const ChatItem = memo(ChatItemComponent)
