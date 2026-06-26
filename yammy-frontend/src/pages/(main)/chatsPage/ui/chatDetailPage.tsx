import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, Copy, Edit2, Reply, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { cn, showErrorToast, useOverlay } from '@/shared'
import { ERouteNames } from '@/shared/lib/routeVariables'

import { useChatWebSocket, usePresence, usePresenceSubscription } from '@/entities/chat'
import type { ChatMessage } from '@/entities/chat'
import { ChatHeader, MessageInput, MessageList } from '@/features/chats'
import { isMessageEditableByAge } from '@/features/chats/lib/messageEdit'
import { AppPageLoader } from '@/app/ui/AppPageLoader'
import { useMatchesOverlay } from '@/features/matches-feed/ui/matches-card/matchesOverlay'
import { TarotCompatibilitySheetContentMemo } from '@/features/tarot-compatibility/ui/tarotCompatibilitySheet'

const CHAT_AVATAR_FALLBACK = '/images/i.webp'

const pageEase = [0.22, 0.61, 0.36, 1] as const

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

const getMessageStatusLabel = (message: ChatMessage): string => {
  if (message.isDeleted) return 'Удалено'
  if (message.isEdited) return 'Изменено'
  return 'Отправлено'
}

const formatMessageSentAtLine = (sentAt: Date): { stacked: boolean; line: string } => {
  const now = new Date()
  const time = sentAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  if (isSameDay(sentAt, now)) {
    return { stacked: false, line: `Сегодня ${time}` }
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(sentAt, yesterday)) {
    return { stacked: true, line: `Вчера ${time}` }
  }

  const weekStartNow = getStartOfWeek(now).getTime()
  const weekStartSent = getStartOfWeek(sentAt).getTime()

  if (weekStartNow === weekStartSent) {
    const weekday = sentAt.toLocaleDateString('ru-RU', { weekday: 'long' })
    return { stacked: true, line: `${weekday} ${time}` }
  }

  const date = sentAt.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return { stacked: true, line: `${date} ${time}` }
}

const ChatDetailPage = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { id: matchId } = useParams<{ id: string }>()
  const {
    messages,
    peer,
    peerProfile,
    status,
    hasMoreMessages,
    isLoadingMessages,
    scrollToBottomKey,
    isPeerTyping,
    markMessagesAsRead,
    loadOlderMessages,
    sendTextMessage,
    deleteMessage,
    editMessage,
    notifyTyping,
    stopTyping,
  } = useChatWebSocket(matchId)
  const { getPeerState } = usePresence()

  useEffect(() => {
    if (status === 'error') {
      navigate(`/${ERouteNames.CHATS_ROUTE}`)
    }
  }, [status, navigate])
  const [replyTo, setReplyTo] = useState<{ id: string; text: string; name: string } | null>(null)
  const [editingMessage, setEditingMessage] = useState<{
    id: string
    text: string
    originalText: string
    previewText: string
  } | null>(null)
  const [menuMessage, setMenuMessage] = useState<ChatMessage | null>(null)
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null)
  const { openProfileDetails } = useMatchesOverlay()
  const { open: openOverlay } = useOverlay()

  const openTarotCompatibility = useCallback(
    (partnerUserId: string, partnerName: string) => {
      openOverlay({
        panelClassName: 'relative w-full max-w-md flex items-end',
        content: (close) => (
          <TarotCompatibilitySheetContentMemo
            partnerUserId={partnerUserId}
            partnerName={partnerName}
            close={close}
          />
        ),
      })
    },
    [openOverlay],
  )
  const subscribedPeerIds = useMemo(() => (peer ? [peer.id] : []), [peer])

  usePresenceSubscription(subscribedPeerIds)

  const peerPresence = getPeerState(peer?.id, peer?.last_seen ?? null)
  const isPeerBanned = Boolean(peer?.is_banned)
  const canInteractWithMessages = !isPeerBanned

  const messageStatusFooter = useMemo(() => {
    if (!menuMessage) {
      return null
    }
    return {
      label: getMessageStatusLabel(menuMessage),
      sentAt: formatMessageSentAtLine(new Date(menuMessage.createdAt)),
    }
  }, [menuMessage])

  useEffect(() => {
    if (!replyTo) {
      return
    }
    const target = messages.find((message) => message.id === replyTo.id)
    if (!target) {
      setReplyTo(null)
    }
  }, [messages, replyTo])

  const getReplyPreviewText = (message: ChatMessage): string => {
    if (message.isDeleted) {
      return 'Удалённое сообщение'
    }
    const hasPhoto = Boolean(message.images?.length)
    return message.text || (hasPhoto ? 'Фото' : '')
  }

  const closeMessageMenu = () => {
    setMenuMessage(null)
    setMenuRect(null)
  }

  const handleOpenMenu = (id: string, rect: DOMRect) => {
    const msg = messages.find((m) => m.id === id)
    if (msg) {
      setMenuMessage(msg)
      setMenuRect(rect)
    }
  }

  const handleReplyAction = () => {
    if (!canInteractWithMessages) {
      return
    }
    if (menuMessage) {
      setEditingMessage(null)
      setReplyTo({
        id: menuMessage.id,
        text: getReplyPreviewText(menuMessage),
        name: menuMessage.senderId === 'me' ? 'Вы' : peer?.name || 'Собеседник',
      })
      closeMessageMenu()
    }
  }

  const canEditMessage = (message: ChatMessage): boolean =>
    canInteractWithMessages &&
    message.uploadStatus !== 'uploading' &&
    !message.isDeleted &&
    message.senderId === 'me' &&
    isMessageEditableByAge(message.createdAt) &&
    (Boolean(message.text?.trim()) || Boolean(message.images?.length))

  const canDeleteMessage = (message: ChatMessage): boolean =>
    canInteractWithMessages &&
    message.uploadStatus !== 'uploading' &&
    !message.isDeleted &&
    message.senderId === 'me'

  const canCopyMessage = (message: ChatMessage): boolean =>
    Boolean(message.text?.trim())

  const handleCopyAction = async () => {
    if (!menuMessage || !canCopyMessage(menuMessage)) {
      return
    }

    try {
      await navigator.clipboard.writeText(menuMessage.text?.trim() ?? '')
      closeMessageMenu()
      showErrorToast('Сообщение скопировано')
    } catch {
      showErrorToast('Не удалось скопировать')
    }
  }

  const handleEditAction = () => {
    if (!canInteractWithMessages) {
      return
    }
    if (menuMessage && canEditMessage(menuMessage)) {
      const hasPhoto = Boolean(menuMessage.images?.length)
      const text = menuMessage.text ?? ''
      setReplyTo(null)
      setEditingMessage({
        id: menuMessage.id,
        text,
        originalText: text,
        previewText: text || (hasPhoto ? 'Фото' : ''),
      })
    }
    closeMessageMenu()
  }

  const handleDeleteAction = () => {
    if (!canInteractWithMessages || !menuMessage || !canDeleteMessage(menuMessage)) {
      return
    }

    const deletedId = menuMessage.id
    deleteMessage(deletedId)

    if (replyTo?.id === deletedId) {
      setReplyTo(null)
    }
    if (editingMessage?.id === deletedId) {
      setEditingMessage(null)
    }
    closeMessageMenu()
  }

  const handleReplyFromSwipe = (messageId: string) => {
    if (!canInteractWithMessages) {
      return
    }
    const msg = messages.find((m) => m.id === messageId)
    if (!msg) return
    setReplyTo({
      id: msg.id,
      text: getReplyPreviewText(msg),
      name: msg.senderId === 'me' ? 'Вы' : peer?.name || 'Собеседник',
    })
  }

  const handleSaveEdit = (text: string) => {
    if (!editingMessage) {
      return
    }

    const trimmed = text.trim()
    if (trimmed === editingMessage.originalText.trim()) {
      setEditingMessage(null)
      return
    }

    const sent = editMessage(editingMessage.id, trimmed)
    if (sent) {
      setEditingMessage(null)
    }
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
    const actionItems = [
      canInteractWithMessages,
      menuMessage ? canCopyMessage(menuMessage) : false,
      menuMessage ? canEditMessage(menuMessage) : false,
      menuMessage ? canDeleteMessage(menuMessage) : false,
    ].filter(Boolean).length
    const menuHeight = 58 + actionItems * 41

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

  const isChatLoading = status !== 'ready' || !peer

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isChatLoading ? (
        <motion.div
          key="chat-loading"
          className="h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: pageEase }}
        >
          <AppPageLoader fullscreen />
        </motion.div>
      ) : (
        <motion.div
          key="chat-ready"
          ref={containerRef}
          className="relative flex h-full flex-col overflow-hidden bg-background pt-[85px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: pageEase }}
        >
          <ChatHeader
            name={peer.name}
            age={peer.age}
            avatar={peer.main_photo || CHAT_AVATAR_FALLBACK}
            online={peerPresence.online}
            isTyping={isPeerTyping && !isPeerBanned}
            lastSeen={peerPresence.lastSeenAt}
            isBanned={isPeerBanned}
            profileLocked={isPeerBanned}
            onAvatarClick={() => {
              if (!peerProfile || isPeerBanned) return
              openProfileDetails({
                item: peerProfile,
                fromChat: true,
                onTarotClick: () =>
                  openTarotCompatibility(peerProfile.user_id, peerProfile.name),
              })
            }}
          />

          <div className="flex flex-1 flex-col overflow-hidden">
            <MessageList
              messages={messages}
              isMenuOpen={Boolean(menuMessage && menuRect)}
              interactionsLocked={isPeerBanned}
              hasMoreMessages={hasMoreMessages}
              isLoadingMessages={isLoadingMessages}
              scrollToBottomKey={scrollToBottomKey}
              onMarkMessagesRead={markMessagesAsRead}
              onLoadOlderMessages={loadOlderMessages}
              onOpenMenu={handleOpenMenu}
              onReplyMessage={handleReplyFromSwipe}
            />
            <MessageInput
              onSend={handleSend}
              onSaveEdit={handleSaveEdit}
              replyTo={replyTo}
              editMessage={editingMessage}
              disabled={isPeerBanned}
              disabledPlaceholder="Запрещено писать забаненному пользователю"
              onTyping={notifyTyping}
              onStopTyping={stopTyping}
              onCancelReply={() => setReplyTo(null)}
              onCancelEdit={() => {
                setEditingMessage(null)
                setReplyTo(null)
              }}
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
                  onClick={closeMessageMenu}
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
                    {canInteractWithMessages && (
                      <button
                        onClick={handleReplyAction}
                        className="flex w-full items-bottom gap-2.5 rounded-[16px] px-3 py-2.5 transition-colors hover:bg-background/60 active:scale-95"
                      >
                        <Reply size={16} strokeWidth={1.2} className="text-foreground" />
                        <span className="text-[13px] font-[200] text-foreground">Ответить</span>
                      </button>
                    )}

                    {menuMessage && canCopyMessage(menuMessage) && (
                      <button
                        onClick={handleCopyAction}
                        className="flex w-full items-bottom gap-2.5 rounded-[16px] px-3 py-2.5 transition-colors hover:bg-background/60 active:scale-95"
                      >
                        <Copy size={16} strokeWidth={1.2} className="text-foreground" />
                        <span className="text-[13px] font-[200] text-foreground">Скопировать</span>
                      </button>
                    )}

                    {menuMessage && canEditMessage(menuMessage) && (
                      <button
                        onClick={handleEditAction}
                        className="flex w-full items-bottom gap-2.5 rounded-[16px] px-3 py-2.5 transition-colors hover:bg-background/60 active:scale-95"
                      >
                        <Edit2 size={16} strokeWidth={1.2} className="text-foreground" />
                        <span className="text-[13px] font-[200] text-foreground">Изменить</span>
                      </button>
                    )}

                    {menuMessage && canDeleteMessage(menuMessage) && (
                      <button
                        onClick={handleDeleteAction}
                        className="flex w-full items-bottom gap-2.5 rounded-[16px] px-3 py-2.5 transition-colors hover:bg-red-500/10 active:scale-95"
                      >
                        <Trash2 size={16} strokeWidth={1.2} className="text-foreground" />
                        <span className="text-[13px] font-[200] text-foreground">Удалить</span>
                      </button>
                    )}

                    <div className="mx-3 mt-1 h-px bg-card-foreground/15" />
                    <div
                      className={cn(
                        'flex gap-1.5 px-3 pt-2 pb-1 text-[12px] font-[200] text-foreground',
                        messageStatusFooter?.sentAt.stacked ? 'items-start' : 'items-center',
                      )}
                    >
                      <CheckCheck className="size-3.5 shrink-0" strokeWidth={2} />
                      {messageStatusFooter?.sentAt.stacked ? (
                        <div className="flex flex-col leading-tight">
                          <span>{messageStatusFooter.label}</span>
                          <span>{messageStatusFooter.sentAt.line}</span>
                        </div>
                      ) : messageStatusFooter ? (
                        <span>
                          {messageStatusFooter.label} {messageStatusFooter.sentAt.line}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ChatDetailPage
