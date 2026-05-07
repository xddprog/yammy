import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { Reply } from 'lucide-react'
import { useRef } from 'react'

import { cn, Image, useOverlay } from '@/shared'

interface MessageBubbleProps {
  id: string
  text?: string
  images?: string[]
  senderId: string
  timestamp: string
  replyToId?: string
  replyToText?: string
  replyToName?: string
  onOpenMenu?: (id: string, rect: DOMRect) => void
  onSwipeReply?: () => void
}

const triggerHaptic = () => {
  const telegramWebApp = (window as Window & { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp as
    | {
        HapticFeedback?: {
          impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
        }
      }
    | undefined

  if (telegramWebApp?.HapticFeedback?.impactOccurred) {
    telegramWebApp.HapticFeedback.impactOccurred('light')
    return
  }

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(18)
  }
}

export const MessageBubble = ({
  id,
  text,
  images,
  senderId,
  timestamp,
  replyToId,
  replyToText,
  replyToName,
  onOpenMenu,
  onSwipeReply,
}: MessageBubbleProps) => {
  const isMe = senderId === 'me'
  const messageImages = images ?? []
  const hasPhotoMessage = messageImages.length > 0 && !text
  const { open } = useOverlay()
  const swipeX = useMotionValue(0)
  const longPressTimerRef = useRef<number | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const replyOpacity = useTransform(swipeX, [-20, -72], [0, 1])
  const replyScale = useTransform(swipeX, [-20, -72], [0.78, 1])
  const replyShiftX = useTransform(swipeX, [-20, -72], [10, 0])

  const openImagesPreview = (index: number) => {
    if (messageImages.length === 0) return
    open({
      backdropClassName: 'bg-black/85 backdrop-blur-0',
      panelClassName: '!h-full !w-full !max-w-none flex items-center justify-center p-4 pointer-events-none',
      content: () => (
        <div className="pointer-events-auto overflow-hidden rounded-[24px] bg-black">
          <Image
            src={messageImages[index]}
            alt="Message image full"
            className="block h-auto max-h-[88vh] w-auto max-w-[92vw] object-contain"
          />
        </div>
      ),
    })
  }

  const openActionsMenu = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return
    const rect = target.getBoundingClientRect()
    triggerHaptic()
    onOpenMenu?.(id, rect)
  }

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    openActionsMenu(e.currentTarget)
  }

  const clearLongPress = () => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    touchStartRef.current = null
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    if (!touch) return
    const targetElement = e.currentTarget
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    longPressTimerRef.current = window.setTimeout(() => {
      openActionsMenu(targetElement)
      clearLongPress()
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return
    const touch = e.touches[0]
    if (!touch) return
    const dx = Math.abs(touch.clientX - touchStartRef.current.x)
    const dy = Math.abs(touch.clientY - touchStartRef.current.y)
    if (dx > 10 || dy > 10) clearLongPress()
  }

  const handleReplyReferenceClick = () => {
    if (!replyToId) return
    const target = document.getElementById(`chat-message-${replyToId}`)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const bubble = target.querySelector<HTMLElement>('[data-message-bubble]')
    if (!bubble) return
    const sender = bubble.dataset.messageSender
    const peakBrightness = sender === 'other' ? 2 : 1.45
    bubble.animate(
      [
        { filter: 'brightness(1)' },
        { filter: `brightness(${peakBrightness})`, offset: 0.03 },
        { filter: `brightness(${1 + (peakBrightness - 1) * 0.62})`, offset: 0.45 },
        { filter: `brightness(${1 + (peakBrightness - 1) * 0.28})`, offset: 0.75 },
        { filter: 'brightness(1)', offset: 1 },
      ],
      { duration: 5600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    )
  }

  const handleSwipeEnd = () => {
    const shouldReply = swipeX.get() < -56
    animate(swipeX, 0, {
      type: 'spring',
      stiffness: 420,
      damping: 34,
    })
    if (shouldReply) {
      triggerHaptic()
      onSwipeReply?.()
    }
  }

  return (
    <div
      id={`chat-message-${id}`}
      className={cn('relative flex w-full flex-col', isMe ? 'items-end' : 'items-start')}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={clearLongPress}
      onTouchCancel={clearLongPress}
    >
      <motion.div
        className="relative z-10 inline-flex max-w-[80%] flex-col"
        style={{ x: swipeX }}
        drag="x"
        dragConstraints={{ left: -96, right: 0 }}
        dragElastic={{ left: 0.12, right: 0 }}
        dragMomentum={false}
        onDragEnd={handleSwipeEnd}
      >
        <div className="relative">
          <motion.div
            className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 z-20 -translate-y-1/2"
            style={{ opacity: replyOpacity, scale: replyScale, x: replyShiftX }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-lg">
              <Reply className="size-5" strokeWidth={1.8} />
            </div>
          </motion.div>

          <div
          data-message-bubble
          data-message-sender={isMe ? 'me' : 'other'}
          className={cn(
            'overflow-hidden rounded-2xl flex flex-col shadow-sm transition-all active:scale-[0.98] select-none',
            hasPhotoMessage
              ? 'bg-transparent shadow-none'
              : isMe
              ? 'bg-[#FF6BA4] text-white rounded-br-none'
              : 'bg-card text-card-foreground rounded-tl-none',
          )}
          >
        {/* Reply Reference Section */}
        {replyToText && (
          <button
            type="button"
            onClick={handleReplyReferenceClick}
            className={cn(
              'ml-3 mr-2 mt-2 mb-1 flex w-[calc(100%-20px)] cursor-pointer flex-col border-l-2 py-0.5 px-3 text-left transition-opacity hover:opacity-85',
              isMe ? 'border-white/80' : 'border-[#FF6BA4]',
            )}
          >
            <span
              className={cn(
                'text-[11px] font-[200] uppercase tracking-wider',
                isMe ? 'text-white' : 'text-[#FF6BA4]',
              )}
            >
              {replyToName}
            </span>
            <p
              className={cn(
                'truncate text-[13px] font-[100]',
                isMe ? 'text-white/90' : 'text-muted-foreground',
              )}
            >
              {replyToText}
            </p>
          </button>
        )}

        {messageImages.length > 0 && (
          <div className={cn('py-2.5', hasPhotoMessage && '-mx-4 px-4')}>
            <div
              className="flex gap-1.5 overflow-x-auto no-scrollbar"
            >
              {messageImages.map((src, index) => (
                <button
                  key={`${id}-${index}`}
                  type="button"
                  onClick={() => openImagesPreview(index)}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl"
                >
                  <img
                    src={src}
                    alt={`Sent image ${index + 1}`}
                    className="h-full w-full rounded-xl object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        {text && (
          <div className="px-4 py-2.5 text-[15px] font-[100] leading-snug whitespace-pre-wrap break-words">
            {text}
          </div>
        )}
          </div>
        </div>
        <span
          className={cn(
            'mt-1 px-1 text-[11px] font-[100] text-card-foreground/50',
            isMe ? 'self-end text-right' : 'self-start text-left',
          )}
        >
          {timestamp}
        </span>
      </motion.div>
    </div>
  )
}
