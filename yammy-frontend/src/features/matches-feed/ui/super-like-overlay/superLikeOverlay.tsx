import type { PanInfo } from 'framer-motion'
import { animate, motion, useDragControls, useMotionValue } from 'framer-motion'
import { Flame, X } from 'lucide-react'
import { memo, useCallback, useState } from 'react'

import { DragIndicator, SheetCard } from '@/features/matches-feed/ui/sheet-card'
import { Button, cn } from '@/shared'

const MAX_MESSAGE_LENGTH = 200
const DRAG_CLOSE_THRESHOLD = 120
const DRAG_VELOCITY_THRESHOLD = 400

export interface SuperLikeOverlayProps {
  onClose: () => void
  onSend: (message: string) => void
  closeAlso?: () => void
}

const SuperLikeOverlayContent = ({
  onClose,
  onSend,
  closeAlso,
}: SuperLikeOverlayProps): React.JSX.Element => {
  const [message, setMessage] = useState('')
  const trimmed = message.trim()
  const canSend = trimmed.length > 0

  const dragY = useMotionValue(0)
  const dragControls = useDragControls()

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const shouldClose =
        info.offset.y > DRAG_CLOSE_THRESHOLD || info.velocity.y > DRAG_VELOCITY_THRESHOLD
      if (shouldClose) {
        onClose()
      } else {
        animate(dragY, 0, { type: 'spring', stiffness: 350, damping: 35 })
      }
    },
    [dragY, onClose],
  )

  const handleIndicatorClick = useCallback(() => {
    animate(dragY, 0, { type: 'spring', stiffness: 300, damping: 30 })
  }, [dragY])

  const handleSend = useCallback(() => {
    if (!canSend) return
    onSend(trimmed)
    onClose()
    closeAlso?.()
  }, [canSend, trimmed, onSend, onClose, closeAlso])

  return (
    <motion.div
      className="flex h-[70vh] m-4 w-full flex-col"
      style={{ y: dragY }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 400 }}
      dragControls={dragControls}
      dragElastic={0.15}
      dragListener={false}
      onDragEnd={handleDragEnd}
    >
      <SheetCard
        className="flex min-h-0 flex-1 flex-col"
        indicator={
          <DragIndicator
            onPointerDown={(e) => dragControls.start(e)}
            onClick={handleIndicatorClick}
          />
        }
        contentClassName="px-6 flex flex-col min-h-0"
        footer={
          <div className="w-full flex gap-2 items-center px-6 pb-5">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label="Закрыть"
              onClick={onClose}
              className="text-neutral-800"
            >
              <X className="size-5" />
            </Button>
            <div className="w-full">
              <Button
                type="button"
                variant="black"
                size="lg"
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canSend}
                onClick={handleSend}
              >
                Отправить
              </Button>
            </div>
          </div>
        }
      >
        <div className="mb-5 flex flex-col items-start gap-3">
          <Flame className="text-primary size-14" />
          <div className="min-w-0">
            <h2 className="text-[32px] font-bold leading-tight tracking-tight text-black">
              Огонек
            </h2>
            <p className="text-sm font-normal leading-snug text-[#141414]">
              С огоньком можно отправить небольшое сообщение
            </p>
          </div>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          placeholder="Напишите сообщение..."
          rows={4}
          className={cn(
            'w-full resize-none text-sm rounded-[24px] border-0 bg-muted/45 px-4 py-3 text-black',
            'placeholder:text-neutral-500 outline-none transition-colors',
            'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0',
          )}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-label="Сообщение для суперлайка"
        />
        {message.length > 0 && (
          <p className="mt-1.5 text-right text-xs text-neutral-500">
            {message.length}/{MAX_MESSAGE_LENGTH}
          </p>
        )}
      </SheetCard>
    </motion.div>
  )
}

export const SuperLikeOverlayContentMemo = memo(SuperLikeOverlayContent)
