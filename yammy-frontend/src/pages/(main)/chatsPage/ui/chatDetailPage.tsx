import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, Edit2, Reply, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ERouteNames } from '@/shared/lib/routeVariables'

import { useChatWebSocket } from '@/entities/chat'
import type { ChatMessage } from '@/entities/chat'
import { useCurrentUser } from '@/entities/auth/hooks/useCurrentUser'
import type { UserSearchApiUser } from '@/entities/user/types/types'
import { ChatHeader, MessageInput, MessageList } from '@/features/chats'
import { FeedLoading } from '@/features/matches-feed/ui/feed-loading'
import { useMatchesOverlay } from '@/features/matches-feed/ui/matches-card/matchesOverlay'

const CHAT_AVATAR_FALLBACK = '/images/i.webp'

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
  const navigate = useNavigate()
  const { id: matchId } = useParams<{ id: string }>()
  const { data: currentUser } = useCurrentUser()
  const { messages, peer, status, sendTextMessage, deleteMessage } = useChatWebSocket(matchId)

  useEffect(() => {
    if (status === 'error') {
      navigate(`/${ERouteNames.CHATS_ROUTE}`)
    }
  }, [status, navigate])
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; name: string } | null>(null)
  const [menuMessage, setMenuMessage] = useState<ChatMessage | null>(null)
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null)
  const { openProfileDetails } = useMatchesOverlay()
  const lastReadAt = useMemo(() => new Date(), [])
  const readAtLabel = useMemo(() => formatReadAt(lastReadAt), [lastReadAt])

  const chatUserProfile = useMemo<UserSearchApiUser | null>(() => {
    if (!peer || !currentUser) {
      return null
    }

    return {
      user_id: peer.id,
      name: peer.name,
      username: peer.name.toLowerCase().replace(/\s+/g, '_'),
      age: peer.age,
      gender: '',
      relationship_goal: '',
      bio: '',
      city: '',
      job: '',
      job_sphere: '',
      education_level: '',
      education_details: '',
      photos: peer.main_photo ? [peer.main_photo] : [CHAT_AVATAR_FALLBACK],
      filter_option_ids: [],
      match_percentage: 0,
    }
  }, [peer, currentUser])

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
        name: menuMessage.senderId === 'me' ? 'Вы' : peer?.name || 'Собеседник',
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
      deleteMessage(menuMessage.id)
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
      name: msg.senderId === 'me' ? 'Вы' : peer?.name || 'Собеседник',
    })
  }

  const handleSend = (
    text?: string,
    files?: File[],
    replyData?: { id: string; text: string; name: string },
  ) => {
    const trimmed = text?.trim() ?? ''
    if (!trimmed && !files?.length) {
      return
    }
    void sendTextMessage(trimmed, replyData ?? null, files)
    setReplyTo(null)
  }

  const menuStyle = useMemo(() => {
    if (!menuRect || !containerRef.current) return {}
    const containerRect = containerRef.current.getBoundingClientRect()
    const isMe = menuMessage?.senderId === 'me'
    const menuWidth = 180
    const menuHeight = 150

    let top = menuRect.top - containerRect.top - menuHeight / 2 + menuRect.height / 2
    top = Math.max(10, Math.min(top, containerRect.height - menuHeight - 10))

    let left: number
    if (isMe) {
      left = menuRect.left - containerRect.left - menuWidth - 10
    } else {
      left = menuRect.left - containerRect.left + menuRect.width + 10
    }

    left = Math.max(10, Math.min(left, containerRect.width - menuWidth - 10))

    return {
      top: `${top}px`,
      left: `${left}px`,
    }
  }, [menuRect, menuMessage, containerRef])

  if (!matchId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Чат не найден</p>
      </div>
    )
  }

  if (status === 'connecting' || status === 'idle' || status === 'error' || !peer) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <FeedLoading />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative flex h-full flex-col bg-background overflow-hidden pt-[95px]">
      <ChatHeader
        name={peer.name}
        age={peer.age}
        avatar={peer.main_photo || CHAT_AVATAR_FALLBACK}
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

      <AnimatePresence>
        {menuMessage && menuRect && (
          <motion.div
            className="absolute inset-0 z-[60] flex items-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div
              className="absolute inset-0 cursor-default bg-black/20"
              onClick={() => {
                setMenuMessage(null)
                setMenuRect(null)
              }}
            />
            <motion.div
              style={menuStyle}
              className="absolute w-[184px] rounded-[24px] bg-card p-1.5 shadow-2xl backdrop-blur-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ChatDetailPage
