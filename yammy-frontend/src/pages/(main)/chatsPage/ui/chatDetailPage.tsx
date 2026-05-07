import { CheckCheck, Edit2, Reply, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { USERS_SEARCH_FALLBACK_MOCK } from '@/entities/user/mock/apiFallbackMocks'
import type { UserSearchResult } from '@/entities/user/types/types'
import { ChatHeader, MessageInput, MessageList } from '@/features/chats'
import { useMatchesOverlay } from '@/features/matches-feed/ui/matches-card/matchesOverlay'

import { MOCK_CHATS } from '../lib/mockChats'
import { MOCK_MESSAGES, type MockMessage } from '../lib/mockMessages'

const getStartOfWeek = (date: Date): Date => {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

const formatReadAt = (readAt: Date): string => {
  const now = new Date()
  const time = readAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  if (isSameDay(readAt, now)) {
    return `Сегодня ${time}`
  }

  const weekStartNow = getStartOfWeek(now).getTime()
  const weekStartRead = getStartOfWeek(readAt).getTime()

  if (weekStartNow === weekStartRead) {
    const weekday = readAt.toLocaleDateString('ru-RU', { weekday: 'long' })
    return `${weekday} ${time}`
  }

  const date = readAt.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${date} ${time}`
}

const ChatDetailPage = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { id } = useParams<{ id: string }>()
  const chatInfo = useMemo(() => MOCK_CHATS.find((c) => c.id === id), [id])
  const [messages, setMessages] = useState<MockMessage[]>(id ? MOCK_MESSAGES[id] || [] : [])
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; name: string } | null>(null)
  const [menuMessage, setMenuMessage] = useState<MockMessage | null>(null)
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null)
  const { openProfileDetails } = useMatchesOverlay()
  const lastReadAt = useMemo(() => new Date(), [])
  const readAtLabel = useMemo(() => formatReadAt(lastReadAt), [lastReadAt])
  const chatUserProfile = useMemo<UserSearchResult | null>(() => {
    if (!chatInfo) return null

    const fromMock =
      USERS_SEARCH_FALLBACK_MOCK.find(
        (user) =>
          user.name.toLowerCase() === chatInfo.name.toLowerCase() ||
          (chatInfo.age != null && user.age === chatInfo.age),
      ) ?? USERS_SEARCH_FALLBACK_MOCK[0]

    if (!fromMock) return null

    return {
      ...fromMock,
      name: chatInfo.name,
      username: chatInfo.name.toLowerCase().replace(/\s+/g, '_'),
      age: chatInfo.age ?? fromMock.age,
      photos: fromMock.photos.length > 0 ? fromMock.photos : [chatInfo.avatar],
    }
  }, [chatInfo])

  const handleOpenMenu = (id: string, rect: DOMRect) => {
    const msg = messages.find((m) => m.id === id)
    if (msg) {
      setMenuMessage(msg)
      setMenuRect(rect)
    }
  }

  const handleReplyAction = () => {
    if (menuMessage) {
      const hasPhoto = Boolean(menuMessage.images?.length)
      setReplyTo({
        id: menuMessage.id,
        text: menuMessage.text || (hasPhoto ? 'Фото' : ''),
        name: menuMessage.senderId === 'me' ? 'Вы' : chatInfo?.name || 'Собеседник',
      })
      setMenuMessage(null)
      setMenuRect(null)
    }
  }

  const handleEditAction = () => {
    setMenuMessage(null)
    setMenuRect(null)
  }

  const handleDeleteAction = () => {
    if (menuMessage) {
      setMessages((prev) => prev.filter((m) => m.id !== menuMessage.id))
      setMenuMessage(null)
      setMenuRect(null)
    }
  }

  const handleReplyFromSwipe = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId)
    if (!msg) return
    const hasPhoto = Boolean(msg.images?.length)
    setReplyTo({
      id: msg.id,
      text: msg.text || (hasPhoto ? 'Фото' : ''),
      name: msg.senderId === 'me' ? 'Вы' : chatInfo?.name || 'Собеседник',
    })
  }

  const handleSend = (
    text?: string,
    images?: string[],
    replyData?: { id: string; text: string; name: string },
  ) => {
    const newMessage: MockMessage = {
      id: Date.now().toString(),
      text,
      images,
      senderId: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyToId: replyData?.id,
      replyToText: replyData?.text,
      replyToName: replyData?.name,
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const menuStyle = useMemo(() => {
    if (!menuRect || !containerRef.current) return {}
    const containerRect = containerRef.current.getBoundingClientRect()
    const isMe = menuMessage?.senderId === 'me'
    const menuWidth = 180 // Fixed width of the menu
    const menuHeight = 150 // Approximate height of the menu

    // Calculate top position relative to the container
    let top = menuRect.top - containerRect.top - menuHeight / 2 + menuRect.height / 2

    // Constrain top position within the container
    top = Math.max(10, Math.min(top, containerRect.height - menuHeight - 10))

    // Calculate left position relative to the container
    let left: number
    if (isMe) {
      // If message is from 'me' (right side), position menu to its left
      left = menuRect.left - containerRect.left - menuWidth - 10
    } else {
      // If message is from other (left side), position menu to its right
      left = menuRect.left - containerRect.left + menuRect.width + 10
    }

    // Constrain left position within the container
    left = Math.max(10, Math.min(left, containerRect.width - menuWidth - 10))

    return {
      top: `${top}px`,
      left: `${left}px`,
    }
  }, [menuRect, menuMessage, containerRef])

  if (!chatInfo) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Чат не найден</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative flex h-full flex-col bg-background overflow-hidden">
      <ChatHeader
        name={chatInfo.name}
        age={chatInfo.age}
        avatar={chatInfo.avatar}
        online={chatInfo.online}
        onAvatarClick={() => {
          if (!chatUserProfile) return
          openProfileDetails({ item: chatUserProfile, fromChat: true })
        }}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          onOpenMenu={handleOpenMenu}
          onReplyMessage={handleReplyFromSwipe}
        />
        <MessageInput
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>

      {/* Context Menu Overlay */}
      {menuMessage && menuRect && (
        <div className="absolute inset-0 z-[60] flex items-start bg-black/20 animate-in fade-in transition-all">
          <div
            className="absolute inset-0 cursor-default"
            onClick={() => {
              setMenuMessage(null)
              setMenuRect(null)
            }}
          />
          <div
            style={menuStyle}
            className="absolute w-[184px] rounded-[24px] bg-card p-1.5 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex flex-col">
              <button
                onClick={handleReplyAction}
                className="flex w-full items-bottom gap-2.5 rounded-[16px] px-3 py-2.5 transition-colors hover:bg-background/60 active:scale-95"
              >
                <Reply size={16} strokeWidth={1.2} className="text-foreground" />
                <span className="text-[13px] font-[200] text-foreground">Ответить</span>
              </button>

              <button
                onClick={handleEditAction}
                className="flex w-full items-bottom gap-2.5 rounded-[16px] px-3 py-2.5 transition-colors hover:bg-background/60 active:scale-95"
              >
                <Edit2 size={16} strokeWidth={1.2} className="text-foreground" />
                <span className="text-[13px] font-[200] text-foreground">Изменить</span>
              </button>

              <button
                onClick={handleDeleteAction}
                className="flex w-full items-bottom gap-2.5 rounded-[16px] px-3 py-2.5 transition-colors hover:bg-red-500/10 active:scale-95"
              >
                <Trash2 size={16} strokeWidth={1.2} className="text-foreground" />
                <span className="text-[13px] font-[200] text-foreground">Удалить</span>
              </button>

              <div className="mx-3 mt-1 h-px bg-card-foreground/15" />
              <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[12px] font-[200] text-foreground">
                <CheckCheck className="size-3.5" strokeWidth={2} />
                <span>{readAtLabel}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatDetailPage
