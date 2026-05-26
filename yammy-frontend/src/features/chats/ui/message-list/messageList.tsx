import { useEffect, useLayoutEffect, useRef } from 'react'

import { AppLogoLoader } from '@/app/ui/AppLogoLoader'
import type { ChatMessage } from '@/entities/chat'

import { MessageBubble } from '../message-bubble/messageBubble'

interface MessageListProps {
  messages: ChatMessage[]
  isMenuOpen?: boolean
  interactionsLocked?: boolean
  hasMoreMessages?: boolean
  isLoadingMessages?: boolean
  scrollToBottomKey?: number
  onMarkMessagesRead?: (messageIds: string[]) => void
  onLoadOlderMessages?: () => void
  onOpenMenu: (id: string, rect: DOMRect) => void
  onReplyMessage: (id: string) => void
}

export const MessageList = ({
  messages,
  isMenuOpen = false,
  interactionsLocked = false,
  hasMoreMessages = false,
  isLoadingMessages = false,
  scrollToBottomKey = 0,
  onMarkMessagesRead,
  onLoadOlderMessages,
  onOpenMenu,
  onReplyMessage,
}: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const prependSnapshotRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null)
  const lastScrollToBottomKeyRef = useRef(0)

  // Только первая загрузка / новое сообщение снизу — не при подгрузке истории.
  useLayoutEffect(() => {
    if (scrollToBottomKey <= 0 || scrollToBottomKey === lastScrollToBottomKeyRef.current) {
      return
    }
    lastScrollToBottomKeyRef.current = scrollToBottomKey
    const el = scrollRef.current
    if (!el) {
      return
    }
    el.scrollTop = el.scrollHeight
  }, [scrollToBottomKey, messages.length])

  // Подгрузка старых сообщений: остаёмся на том же месте (стандартный приём для prepend).
  useLayoutEffect(() => {
    const snapshot = prependSnapshotRef.current
    const el = scrollRef.current
    if (!snapshot || !el) {
      return
    }
    prependSnapshotRef.current = null
    const delta = el.scrollHeight - snapshot.scrollHeight
    if (delta !== 0) {
      el.scrollTop = snapshot.scrollTop + delta
    }
  }, [messages])

  useEffect(() => {
    if (!isLoadingMessages && prependSnapshotRef.current) {
      prependSnapshotRef.current = null
    }
  }, [isLoadingMessages])

  useEffect(() => {
    if (messages.length === 0) {
      prependSnapshotRef.current = null
      lastScrollToBottomKeyRef.current = 0
    }
  }, [messages.length])

  useEffect(() => {
    const root = scrollRef.current
    if (!root || !onMarkMessagesRead) {
      return
    }

    const unreadIncomingIds = new Set(
      messages
        .filter((message) => message.senderId === 'other' && !message.isRead && !message.isDeleted)
        .map((message) => message.id),
    )
    if (unreadIncomingIds.size === 0) {
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      onMarkMessagesRead([...unreadIncomingIds])
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleIds = entries.flatMap((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) {
            return []
          }
          const messageId = (entry.target as HTMLElement).dataset.messageId
          return messageId && unreadIncomingIds.has(messageId) ? [messageId] : []
        })

        if (visibleIds.length > 0) {
          onMarkMessagesRead([...new Set(visibleIds)])
        }
      },
      { root, threshold: [0.6] },
    )

    root.querySelectorAll<HTMLElement>('[data-message-id]').forEach((element) => {
      const messageId = element.dataset.messageId
      if (messageId && unreadIncomingIds.has(messageId)) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [messages, onMarkMessagesRead])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || !hasMoreMessages || isLoadingMessages || !onLoadOlderMessages) {
      return
    }
    if (el.scrollTop > 48) {
      return
    }

    prependSnapshotRef.current = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
    }
    onLoadOlderMessages()
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto px-4 py-2 no-scrollbar"
    >
      {isLoadingMessages && messages.length > 0 && (
        <div className="flex shrink-0 justify-center py-2" aria-busy aria-label="Подгрузка сообщений">
          <AppLogoLoader size="small" />
        </div>
      )}
      {messages.map((msg) => (
        <div key={msg.id} data-message-id={msg.id}>
          <MessageBubble
            id={msg.id}
            text={msg.text}
            images={msg.images}
            senderId={msg.senderId}
            timestamp={msg.timestamp}
            isRead={msg.isRead}
            isEdited={msg.isEdited}
            isDeleted={msg.isDeleted}
            replyToId={msg.replyToId}
            replyToText={msg.replyToText}
            replyToName={msg.replyToName}
            onOpenMenu={interactionsLocked ? undefined : onOpenMenu}
            onSwipeReply={
              interactionsLocked || isMenuOpen ? undefined : () => onReplyMessage(msg.id)
            }
          />
        </div>
      ))}
    </div>
  )
}
