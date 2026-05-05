import { useEffect, useRef } from 'react'

import type { MockMessage } from '@/pages/(main)/chatsPage/lib/mockMessages'

import { MessageBubble } from '../message-bubble/messageBubble'

interface MessageListProps {
  messages: MockMessage[]
  onOpenMenu: (id: string, rect: DOMRect) => void
}

export const MessageList = ({ messages, onOpenMenu }: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 px-4 py-2"
    >
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          id={msg.id}
          text={msg.text}
          image={msg.image}
          senderId={msg.senderId}
          timestamp={msg.timestamp}
          replyToText={msg.replyToText}
          replyToName={msg.replyToName}
          onOpenMenu={onOpenMenu}
        />
      ))}
    </div>
  )
}
