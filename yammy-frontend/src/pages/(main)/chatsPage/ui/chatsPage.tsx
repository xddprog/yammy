import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

import { Image } from '@/shared'

import { MOCK_CHATS, MOCK_CHAT_STORIES } from '../lib/mockChats'

const ChatsPage = (): JSX.Element => {
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col overflow-hidden text-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[30px] leading-[0.95] font-medium tracking-[0]">Chat</h1>
        <button
          type="button"
          aria-label="Поиск"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/12 transition-colors hover:bg-white/18 active:bg-white/24"
        >
          <Search size={26} strokeWidth={1.8} />
        </button>
      </div>

      <div className="-mx-2 mb-6 overflow-x-auto px-2 no-scrollbar">
        <div className="flex w-max items-center gap-1 pb-1">
          {MOCK_CHAT_STORIES.map((story) => (
            <button
              key={story.id}
              type="button"
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-white/10"
            >
              {story.avatar == null ? (
                <Plus size={28} strokeWidth={1.8} />
              ) : (
                <span className="block h-[64px] w-[64px] overflow-hidden rounded-full border-2 border-[#D6FF7A]">
                  <Image src={story.avatar} alt="story avatar" className="h-full w-full object-cover" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-1.5 pb-4">
          {MOCK_CHATS.length > 0 ? (
            MOCK_CHATS.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => navigate(`/chats/${chat.id}`)}
                className="flex w-full items-center gap-1 rounded-[26px] bg-[#5a30af]/70 px-4 py-3 text-left transition-colors hover:bg-[#5f33b6] active:bg-[#663ac0]"
              >
                <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-full">
                  <Image src={chat.avatar} alt={chat.name} className="h-full w-full object-cover" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold leading-tight">
                    {chat.name}
                  </span>
                  <span
                    className={`mt-0.5 block truncate text-[13px] leading-tight ${
                      chat.isTyping ? 'text-white/60' : 'text-white/75'
                    }`}
                  >
                    {chat.lastMessage}
                  </span>
                </span>

                {chat.unreadCount > 0 ? (
                  <span className="flex h-8 min-w-[32px] items-center justify-center rounded-full bg-[#D6FF7A] px-2 text-[14px] font-bold leading-none text-[#24175a]">
                    {chat.unreadCount}
                  </span>
                ) : chat.isMutedUnreadDot ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D6FF7A]" />
                ) : null}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center pt-20 text-center">
              <p className="text-[15px] font-medium text-white/60">Ничего не найдено</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatsPage
