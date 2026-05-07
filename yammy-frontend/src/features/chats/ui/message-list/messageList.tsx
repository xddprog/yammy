import { useEffect, useRef } from 'react'

import type { MockMessage } from '@/pages/(main)/chatsPage/lib/mockMessages'

import { MessageBubble } from '../message-bubble/messageBubble'

interface MessageListProps {
  messages: MockMessage[]
  onOpenMenu: (id: string, rect: DOMRect) => void
  onReplyMessage: (id: string) => void
}

export const MessageList = ({ messages, onOpenMenu, onReplyMessage }: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar flex flex-col gap-3 px-4 py-2"
    >
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          id={msg.id}
          text={msg.text}
          images={msg.images}
          senderId={msg.senderId}
          timestamp={msg.timestamp}
          replyToId={msg.replyToId}
          replyToText={msg.replyToText}
          replyToName={msg.replyToName}
          onOpenMenu={onOpenMenu}
          onSwipeReply={() => onReplyMessage(msg.id)}
        />
      ))}
    </div>
  )
}
