import { Plus } from 'lucide-react'
import type { JSX } from 'react'

import type { ChatListItem } from '@/entities/chat'

/** Без ring-offset — offset рисуется снаружи кнопки и даёт лишнюю ширину / дёрганье по X у всей страницы */
const STORY_RING = 'ring-2 ring-[#FF6BA4] ring-inset'

interface ChatsStoriesRowProps {
  chats: ChatListItem[]
  onStoryClick?: (chatId: string) => void
}

export const ChatsStoriesRow = ({ chats, onStoryClick }: ChatsStoriesRowProps): JSX.Element => {
  const slice = chats.slice(0, 8)

  return (
    <div className="no-scrollbar flex min-w-0 gap-3 overflow-x-auto overflow-y-hidden pb-1 pt-1">
      <button
        type="button"
        className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-card text-foreground transition-transform active:scale-95"
        aria-label="Добавить историю"
      >
        <Plus className="size-6 stroke-[1.5]" aria-hidden />
      </button>
      {slice.map((chat) => (
        <button
          key={chat.id}
          type="button"
          onClick={() => onStoryClick?.(chat.id)}
          className={`relative size-[50px] shrink-0 rounded-full p-0.5 ${STORY_RING}`}
          aria-label={`История ${chat.name}`}
        >
          <span className="block h-full w-full overflow-hidden rounded-full bg-muted">
            <img src={chat.avatar} alt="" className="h-full w-full object-cover" />
          </span>
        </button>
      ))}
    </div>
  )
}
