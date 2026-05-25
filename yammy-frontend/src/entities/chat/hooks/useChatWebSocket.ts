import { useCallback, useEffect, useRef, useState } from 'react'

import { useCurrentUser } from '@/entities/auth/hooks/useCurrentUser'
import { showErrorToast } from '@/shared'

import { buildChatWebSocketUrl } from '../lib/buildChatWebSocketUrl'
import { filesToMessageImages } from '../lib/filesToMessageImages'
import { CHAT_WS_EVENTS } from '../lib/chatWsEvents'
import { mapMessageDtoToChatMessage } from '../lib/mapChatMessage'
import type { ChatMessageDto, ChatOpenData, ChatWsEnvelope, ChatWsErrorData, ChatWsPeer } from '../types/chatSocket'
import type { ChatMessage } from '../types/message'

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

export function useChatWebSocket(matchId: string | undefined) {
  const { data: currentUser } = useCurrentUser()
  const currentUserId = currentUser?.id

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [peer, setPeer] = useState<ChatWsPeer | null>(null)
  const [status, setStatus] = useState<ChatSocketStatus>('idle')

  const wsRef = useRef<WebSocket | null>(null)
  const peerRef = useRef<ChatWsPeer | null>(null)
  const chatIdRef = useRef<string | null>(null)
  const currentUserIdRef = useRef(currentUserId)
  const pendingOpenChatRef = useRef<ChatOpenData | null>(null)

  currentUserIdRef.current = currentUserId

  const applyOpenChat = useCallback((data: ChatOpenData, userId: string) => {
    const nextPeer = {
      id: data.user_to.id,
      name: data.user_to.name,
      age: data.user_to.age,
      main_photo: data.user_to.main_photo,
      last_seen: data.user_to.last_seen,
    }
    chatIdRef.current = data.id
    peerRef.current = nextPeer
    setPeer(nextPeer)
    setMessages(data.messages.map((message) => mapMessageDtoToChatMessage(message, userId)))
    setStatus('ready')
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
          applyOpenChat(data, userId)
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
          setMessages((prev) =>
            upsertMessage(prev, mapMessageDtoToChatMessage(dto, userId)),
          )
          break
        }
        default:
          break
      }
    },
    [applyOpenChat, reportError],
  )

  const handleEnvelopeRef = useRef(handleEnvelope)
  handleEnvelopeRef.current = handleEnvelope

  useEffect(() => {
    if (!currentUserId || !pendingOpenChatRef.current) {
      return
    }
    applyOpenChat(pendingOpenChatRef.current, currentUserId)
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
    pendingOpenChatRef.current = null

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
      ws.close()
      if (wsRef.current === ws) {
        wsRef.current = null
      }
    }
  }, [matchId, reportError])

  const sendPayload = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return false
    }
    wsRef.current.send(JSON.stringify(payload))
    return true
  }, [])

  const sendTextMessage = useCallback(
    async (text: string, replyTo?: ReplyPayload | null, files?: File[]) => {
      if (!currentUserId || !chatIdRef.current) {
        showErrorToast('Чат ещё не готов')
        return false
      }

      const images = files?.length ? await filesToMessageImages(files) : []

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
    [currentUserId, sendPayload],
  )

  const deleteMessage = useCallback(
    (messageId: string) => {
      return sendPayload({
        event: CHAT_WS_EVENTS.DELETE,
        message_id: messageId,
      })
    },
    [sendPayload],
  )

  return {
    messages,
    peer,
    status,
    sendTextMessage,
    deleteMessage,
  }
}
