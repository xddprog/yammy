import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ChatItem, SearchBar } from '@/features/chats'

import { MOCK_CHATS } from '../lib/mockChats'

const ChatsPage = (): JSX.Element => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = useMemo(() => {
    return MOCK_CHATS.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden">
      <SearchBar onSearch={setSearchQuery} />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-1 pb-4">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} onClick={() => navigate(`/chats/${chat.id}`)} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center pt-20 text-center">
              <p className="text-[15px] font-medium text-muted-foreground/60">Ничего не найдено</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatsPage
