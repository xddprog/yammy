import { Edit2, Reply, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { ChatHeader, MessageInput, MessageList } from '@/features/chats'

import { MOCK_CHATS } from '../lib/mockChats'
import { MOCK_MESSAGES, type MockMessage } from '../lib/mockMessages'

const ChatDetailPage = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { id } = useParams<{ id: string }>()
  const chatInfo = useMemo(() => MOCK_CHATS.find((c) => c.id === id), [id])
  const [messages, setMessages] = useState<MockMessage[]>(id ? MOCK_MESSAGES[id] || [] : [])
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; name: string } | null>(null)
  const [menuMessage, setMenuMessage] = useState<MockMessage | null>(null)
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null)

  const handleOpenMenu = (id: string, rect: DOMRect) => {
    const msg = messages.find((m) => m.id === id)
    if (msg) {
      setMenuMessage(msg)
      setMenuRect(rect)
    }
  }

  const handleReplyAction = () => {
    if (menuMessage) {
      setReplyTo({
        id: menuMessage.id,
        text: menuMessage.text || 'Фото',
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

  const handleSend = (
    text?: string,
    image?: string,
    replyData?: { id: string; text: string; name: string },
  ) => {
    const newMessage: MockMessage = {
      id: Date.now().toString(),
      text,
      image,
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
      <ChatHeader name={chatInfo.name} avatar={chatInfo.avatar} online={chatInfo.online} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <MessageList messages={messages} onOpenMenu={handleOpenMenu} />
        <MessageInput
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>

      {/* Context Menu Overlay */}
      {menuMessage && menuRect && (
        <div className="absolute inset-0 z-[60] flex items-start bg-black/5 animate-in fade-in transition-all">
          <div
            className="absolute inset-0 cursor-default"
            onClick={() => {
              setMenuMessage(null)
              setMenuRect(null)
            }}
          />
          <div
            style={menuStyle}
            className="absolute w-[180px] rounded-[22px] bg-muted/90 p-1 animate-in zoom-in-95 duration-200"
          >
            <div className="flex flex-col">
              <button
                onClick={handleReplyAction}
                className="flex w-full items-center gap-2.5 rounded-[16px] px-3 py-2 transition-colors hover:bg-muted/80 active:scale-95"
              >
                <Reply size={16} strokeWidth={1.2} className="text-foreground" />
                <span className="text-[13px] font-light text-foreground">Ответить</span>
              </button>

              <div className="mx-3 my-0.5 h-[0.5px] bg-muted/30" />

              <button
                onClick={handleEditAction}
                className="flex w-full items-center gap-2.5 rounded-[16px] px-3 py-2 transition-colors hover:bg-muted/80 active:scale-95"
              >
                <Edit2 size={16} strokeWidth={1.2} className="text-foreground" />
                <span className="text-[13px] font-light text-foreground">Изменить</span>
              </button>

              <div className="mx-3 my-0.5 h-[0.5px] bg-muted/30" />

              <button
                onClick={handleDeleteAction}
                className="flex w-full items-center gap-2.5 rounded-[16px] px-3 py-2 transition-colors hover:bg-red-500/10 active:scale-95"
              >
                <Trash2 size={16} strokeWidth={1.2} className="text-red-500" />
                <span className="text-[13px] font-light text-red-500">Удалить</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatDetailPage
