import { cn } from '@/shared'

interface MessageBubbleProps {
  id: string
  text?: string
  image?: string
  senderId: string
  timestamp: string
  replyToText?: string
  replyToName?: string
  onOpenMenu?: (id: string, rect: DOMRect) => void
}

export const MessageBubble = ({
  id,
  text,
  image,
  senderId,
  timestamp,
  replyToText,
  replyToName,
  onOpenMenu,
}: MessageBubbleProps) => {
  const isMe = senderId === 'me'

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    onOpenMenu?.(id, rect)
  }

  return (
    <div
      className={cn('relative flex w-full flex-col', isMe ? 'items-end' : 'items-start')}
      onContextMenu={handleContextMenu}
    >
      <div
        className={cn(
          'max-w-[80%] overflow-hidden rounded-2xl flex flex-col shadow-sm transition-all active:scale-[0.98] select-none touch-none',
          isMe
            ? 'bg-[#FF6BA4] text-white rounded-br-none'
            : 'bg-muted text-foreground rounded-bl-none',
        )}
      >
        {/* Reply Reference Section */}
        {replyToText && (
          <div
            className={cn(
              'ml-3 mr-2 mt-2 flex flex-col border-l-2 py-0.5 px-3 mb-1',
              isMe ? 'border-white/80' : 'border-[#FF6BA4]',
            )}
          >
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider',
                isMe ? 'text-white' : 'text-[#FF6BA4]',
              )}
            >
              {replyToName}
            </span>
            <p
              className={cn(
                'truncate text-[13px] font-light',
                isMe ? 'text-white/90' : 'text-muted-foreground',
              )}
            >
              {replyToText}
            </p>
          </div>
        )}

        {image && (
          <div
            className={cn(
              'relative max-w-full overflow-hidden',
              text || replyToText ? 'rounded-t-2xl' : 'rounded-2xl',
            )}
          >
            <img
              src={image}
              alt="Sent image"
              className="h-auto max-h-[400px] w-full object-cover"
            />
          </div>
        )}
        {text && <div className="px-4 py-2.5 text-[15px] font-extralight leading-snug">{text}</div>}
      </div>
      <span className="mt-1 px-1 text-[11px] font-medium text-muted-foreground/50">
        {timestamp}
      </span>
    </div>
  )
}
