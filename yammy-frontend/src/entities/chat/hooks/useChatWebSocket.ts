import { useCallback, useEffect, useRef, useState } from 'react'

import { useCurrentUser } from '@/entities/auth/hooks/useCurrentUser'
import { showErrorToast } from '@/shared'

import { buildChatWebSocketUrl } from '../lib/buildChatWebSocketUrl'
import { filesToMessageImages } from '../lib/filesToMessageImages'
import { CHAT_WS_EVENTS } from '../lib/chatWsEvents'
import { mapChatPeerDetailDto } from '../lib/mapChatPeerDetail'
import { mapMessageDtoToChatMessage } from '../lib/mapChatMessage'
import type {
  ChatMessageDto,
  ChatMessagesPageData,
  ChatOpenData,
  ChatTypingData,
  ChatWsEnvelope,
  ChatWsErrorData,
  ChatWsPeer,
} from '../types/chatSocket'
import type { ChatMessage } from '../types/message'
import type { UserSearchApiUser } from '@/entities/user/types/types'

const MESSAGES_PAGE_SIZE = 30
const TYPING_IDLE_MS = 3_000
const PEER_TYPING_TIMEOUT_MS = 4_000

type ChatSocketStatus = 'idle' | 'connecting' | 'ready' | 'error' | 'closed'

type ReplyPayload = {
  id: string
  text: string
  name: string
}

function upsertMessage(messages: ChatMessage[], next: ChatMessage): ChatMessage[] {
  const index = messages.findIndex((message) => message.id === next.id)
  if (index === -1) {
    return [...messages, next]
  }
  const copy = [...messages]
  copy[index] = next
  return copy
}

function prependOlderMessages(existing: ChatMessage[], older: ChatMessage[]): ChatMessage[] {
  const ids = new Set(existing.map((message) => message.id))
  const uniqueOlder = older.filter((message) => !ids.has(message.id))
  return [...uniqueOlder, ...existing]
}

export function useChatWebSocket(matchId: string | undefined) {
  const { data: currentUser } = useCurrentUser()
  const currentUserId = currentUser?.id

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [peer, setPeer] = useState<ChatWsPeer | null>(null)
  const [peerProfile, setPeerProfile] = useState<UserSearchApiUser | null>(null)
  const [status, setStatus] = useState<ChatSocketStatus>('idle')
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [scrollToBottomKey, setScrollToBottomKey] = useState(0)
  const [isPeerTyping, setIsPeerTyping] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const peerRef = useRef<ChatWsPeer | null>(null)
  const chatIdRef = useRef<string | null>(null)
  const currentUserIdRef = useRef(currentUserId)
  const pendingOpenChatRef = useRef<ChatOpenData | null>(null)
  const messagesPageRef = useRef(0)
  const isLoadingMessagesRef = useRef(false)
  const readQueueRef = useRef<string[]>([])
  const queuedReadIdsRef = useRef<Set<string>>(new Set())
  const readFlushTimerRef = useRef<number | null>(null)
  const typingIdleTimerRef = useRef<number | null>(null)
  const isTypingActiveRef = useRef(false)
  const peerTypingTimerRef = useRef<number | null>(null)

  currentUserIdRef.current = currentUserId

  const sendPayload = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return false
    }
    wsRef.current.send(JSON.stringify(payload))
    return true
  }, [])

  const clearTypingIdleTimer = useCallback(() => {
    if (typingIdleTimerRef.current != null) {
      window.clearTimeout(typingIdleTimerRef.current)
      typingIdleTimerRef.current = null
    }
  }, [])

  const clearPeerTypingTimer = useCallback(() => {
    if (peerTypingTimerRef.current != null) {
      window.clearTimeout(peerTypingTimerRef.current)
      peerTypingTimerRef.current = null
    }
  }, [])

  const sendTypingState = useCallback(
    (isTyping: boolean) => {
      if (!chatIdRef.current || peerRef.current?.is_banned) {
        return
      }

      sendPayload({
        event: CHAT_WS_EVENTS.TYPING,
        chat_id: chatIdRef.current,
        is_typing: isTyping,
      })
    },
    [sendPayload],
  )

  const stopTyping = useCallback(() => {
    clearTypingIdleTimer()
    if (!isTypingActiveRef.current) {
      return
    }
    isTypingActiveRef.current = false
    sendTypingState(false)
  }, [clearTypingIdleTimer, sendTypingState])

  const notifyTyping = useCallback(() => {
    if (!chatIdRef.current || peerRef.current?.is_banned) {
      return
    }

    if (!isTypingActiveRef.current) {
      isTypingActiveRef.current = true
      sendTypingState(true)
    }

    clearTypingIdleTimer()
    typingIdleTimerRef.current = window.setTimeout(() => {
      stopTyping()
    }, TYPING_IDLE_MS)
  }, [clearTypingIdleTimer, sendTypingState, stopTyping])

  const flushReadQueue = useCallback(() => {
    if (readFlushTimerRef.current != null) {
      return
    }

    const sendNext = () => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        readFlushTimerRef.current = null
        return
      }

      const nextMessageId = readQueueRef.current.shift()
      if (!nextMessageId) {
        readFlushTimerRef.current = null
        return
      }

      const sent = sendPayload({
        event: CHAT_WS_EVENTS.READ,
        message_id: nextMessageId,
      })

      if (!sent) {
        queuedReadIdsRef.current.delete(nextMessageId)
        readFlushTimerRef.current = null
        return
      }

      if (readQueueRef.current.length === 0) {
        readFlushTimerRef.current = null
        return
      }

      readFlushTimerRef.current = window.setTimeout(() => {
        readFlushTimerRef.current = null
        sendNext()
      }, 150)
    }

    sendNext()
  }, [sendPayload])

  const markMessagesAsRead = useCallback(
    (messageIds: string[]) => {
      const messageById = new Map(messages.map((message) => [message.id, message]))
      let added = false

      messageIds.forEach((messageId) => {
        const message = messageById.get(messageId)
        if (!message) {
          return
        }
        if (
          message.senderId !== 'other' ||
          message.isRead ||
          message.isDeleted ||
          queuedReadIdsRef.current.has(message.id)
        ) {
          return
        }

        queuedReadIdsRef.current.add(message.id)
        readQueueRef.current.push(message.id)
        added = true
      })

      if (added) {
        flushReadQueue()
      }
    },
    [flushReadQueue, messages],
  )

  const requestMessages = useCallback(
    (page: number) => {
      if (!chatIdRef.current || isLoadingMessagesRef.current) {
        return false
      }
      isLoadingMessagesRef.current = true
      setIsLoadingMessages(true)
      return sendPayload({
        event: CHAT_WS_EVENTS.MESSAGES,
        page,
        size: MESSAGES_PAGE_SIZE,
      })
    },
    [sendPayload],
  )

  const applyOpenChat = useCallback(
    (data: ChatOpenData) => {
      const { profile, header } = mapChatPeerDetailDto(data.user_to)
      chatIdRef.current = data.id
      peerRef.current = header
      setPeer(header)
      setPeerProfile(profile)
      setMessages([])
      messagesPageRef.current = 0
      setHasMoreMessages(false)
      requestMessages(1)
    },
    [requestMessages],
  )

  const applyMessagesPage = useCallback((data: ChatMessagesPageData, userId: string) => {
    isLoadingMessagesRef.current = false
    setIsLoadingMessages(false)
    messagesPageRef.current = data.page
    setHasMoreMessages(data.page * data.size < data.total)

    const mapped = data.items.map((message) => mapMessageDtoToChatMessage(message, userId))
    setMessages((prev) => (data.page === 1 ? mapped : prependOlderMessages(prev, mapped)))
    if (data.page === 1) {
      setStatus('ready')
      setScrollToBottomKey((key) => key + 1)
    }
  }, [])

  const reportError = useCallback((message: string, fatal = false) => {
    showErrorToast(message)
    if (fatal) {
      setStatus('error')
    }
  }, [])

  const handleEnvelope = useCallback(
    (envelope: ChatWsEnvelope) => {
      switch (envelope.event) {
        case CHAT_WS_EVENTS.ERROR: {
          const error = envelope.data as ChatWsErrorData
          const wasInitialMessagesLoad =
            isLoadingMessagesRef.current && messagesPageRef.current === 0
          if (isLoadingMessagesRef.current) {
            isLoadingMessagesRef.current = false
            setIsLoadingMessages(false)
          }
          if (wasInitialMessagesLoad && peerRef.current) {
            setStatus('ready')
          }
          reportError(error.detail, !peerRef.current)
          break
        }
        case CHAT_WS_EVENTS.OPEN_CHAT: {
          const data = envelope.data as ChatOpenData
          const userId = currentUserIdRef.current
          if (!userId) {
            pendingOpenChatRef.current = data
            return
          }
          applyOpenChat(data)
          break
        }
        case CHAT_WS_EVENTS.MESSAGES: {
          const userId = currentUserIdRef.current
          if (!userId) {
            isLoadingMessagesRef.current = false
            setIsLoadingMessages(false)
            return
          }
          applyMessagesPage(envelope.data as ChatMessagesPageData, userId)
          break
        }
        case CHAT_WS_EVENTS.TYPING: {
          const data = envelope.data as ChatTypingData
          if (data.user_id === currentUserIdRef.current) {
            break
          }
          if (data.is_typing) {
            setIsPeerTyping(true)
            clearPeerTypingTimer()
            peerTypingTimerRef.current = window.setTimeout(() => {
              setIsPeerTyping(false)
              peerTypingTimerRef.current = null
            }, PEER_TYPING_TIMEOUT_MS)
          } else {
            setIsPeerTyping(false)
            clearPeerTypingTimer()
          }
          break
        }
        case CHAT_WS_EVENTS.MESSAGE:
        case CHAT_WS_EVENTS.READ:
        case CHAT_WS_EVENTS.EDIT:
        case CHAT_WS_EVENTS.DELETE: {
          const userId = currentUserIdRef.current
          if (!userId) {
            return
          }
          const dto = envelope.data as ChatMessageDto
          const isNewMessage = envelope.event === CHAT_WS_EVENTS.MESSAGE
          if (envelope.event === CHAT_WS_EVENTS.READ) {
            queuedReadIdsRef.current.delete(dto.id)
          }
          if (isNewMessage && dto.sender.id !== userId) {
            setIsPeerTyping(false)
            clearPeerTypingTimer()
          }
          setMessages((prev) =>
            upsertMessage(prev, mapMessageDtoToChatMessage(dto, userId)),
          )
          if (isNewMessage) {
            setScrollToBottomKey((key) => key + 1)
          }
          break
        }
        default:
          break
      }
    },
    [applyOpenChat, applyMessagesPage, clearPeerTypingTimer, reportError],
  )

  const handleEnvelopeRef = useRef(handleEnvelope)
  handleEnvelopeRef.current = handleEnvelope

  useEffect(() => {
    if (!currentUserId || !pendingOpenChatRef.current) {
      return
    }
    applyOpenChat(pendingOpenChatRef.current)
    pendingOpenChatRef.current = null
  }, [currentUserId, applyOpenChat])

  useEffect(() => {
    if (!matchId) {
      return
    }

    const url = buildChatWebSocketUrl(matchId)
    if (!url) {
      reportError('Нет авторизации', true)
      return
    }

    let cancelled = false
    setStatus('connecting')
    setPeer(null)
    setPeerProfile(null)
    setIsPeerTyping(false)
    setMessages([])
    messagesPageRef.current = 0
    setHasMoreMessages(false)
    isLoadingMessagesRef.current = false
    setIsLoadingMessages(false)
    pendingOpenChatRef.current = null
    readQueueRef.current = []
    queuedReadIdsRef.current.clear()
    if (readFlushTimerRef.current != null) {
      window.clearTimeout(readFlushTimerRef.current)
      readFlushTimerRef.current = null
    }
    isTypingActiveRef.current = false
    clearTypingIdleTimer()
    clearPeerTypingTimer()

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (cancelled) {
        return
      }
      ws.send(JSON.stringify({ event: CHAT_WS_EVENTS.OPEN_CHAT }))
    }

    ws.onmessage = (event) => {
      if (cancelled) {
        return
      }
      try {
        const envelope = JSON.parse(event.data as string) as ChatWsEnvelope
        handleEnvelopeRef.current(envelope)
      } catch {
        isLoadingMessagesRef.current = false
        setIsLoadingMessages(false)
        reportError('Не удалось обработать ответ сервера', !peerRef.current)
      }
    }

    ws.onerror = () => {
      if (!cancelled) {
        reportError('Ошибка соединения с чатом', !peerRef.current)
      }
    }

    ws.onclose = (event) => {
      if (cancelled) {
        return
      }
      if (event.code !== 1000) {
        const message = `Соединение закрыто (код ${event.code}${event.reason ? `: ${event.reason}` : ''})`
        if (peerRef.current) {
          showErrorToast(message)
          setStatus('closed')
        } else {
          reportError(message, true)
        }
      } else {
        setStatus((prev) => (prev === 'error' ? prev : 'closed'))
      }
      wsRef.current = null
    }

    return () => {
      cancelled = true
      stopTyping()
      ws.close()
      if (readFlushTimerRef.current != null) {
        window.clearTimeout(readFlushTimerRef.current)
        readFlushTimerRef.current = null
      }
      clearPeerTypingTimer()
      if (wsRef.current === ws) {
        wsRef.current = null
      }
    }
  }, [clearPeerTypingTimer, clearTypingIdleTimer, matchId, reportError, stopTyping])

  const loadOlderMessages = useCallback(() => {
    if (!hasMoreMessages || isLoadingMessagesRef.current) {
      return
    }
    requestMessages(messagesPageRef.current + 1)
  }, [hasMoreMessages, requestMessages])

  const sendTextMessage = useCallback(
    async (text: string, replyTo?: ReplyPayload | null, files?: File[]) => {
      if (!currentUserId || !chatIdRef.current) {
        showErrorToast('Чат ещё не готов')
        return false
      }
      if (peerRef.current?.is_banned) {
        showErrorToast(
          'Нельзя отправлять, изменять, удалять или отвечать на сообщения в чате с забаненным пользователем',
        )
        return false
      }

      const images = files?.length ? await filesToMessageImages(files) : []

      stopTyping()

      const sent = sendPayload({
        event: CHAT_WS_EVENTS.MESSAGE,
        chat_id: chatIdRef.current,
        content: text,
        sender_id: currentUserId,
        reply_to_id: replyTo?.id ?? null,
        images,
      })
      if (!sent) {
        showErrorToast('Не удалось отправить сообщение')
      }
      return sent
    },
    [currentUserId, sendPayload, stopTyping],
  )

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (peerRef.current?.is_banned) {
        showErrorToast(
          'Нельзя отправлять, изменять, удалять или отвечать на сообщения в чате с забаненным пользователем',
        )
        return false
      }

      return sendPayload({
        event: CHAT_WS_EVENTS.DELETE,
        message_id: messageId,
      })
    },
    [sendPayload],
  )

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (peerRef.current?.is_banned) {
        showErrorToast(
          'Нельзя отправлять, изменять, удалять или отвечать на сообщения в чате с забаненным пользователем',
        )
        return false
      }

      const sent = sendPayload({
        event: CHAT_WS_EVENTS.EDIT,
        message_id: messageId,
        content,
      })
      if (!sent) {
        showErrorToast('Не удалось изменить сообщение')
      }
      return sent
    },
    [sendPayload],
  )

  return {
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
  }
}
