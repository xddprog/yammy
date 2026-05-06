import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Heart, X } from 'lucide-react'
import { memo } from 'react'

import { Button, cn } from '@/shared'

export interface SwipeCardActionsProps {
  compatibility?: number
  onDislike?: () => void
  isSuperLikeMode: boolean
  rootRef: React.RefObject<HTMLDivElement | null>
  onLikePointerDown: React.PointerEventHandler<HTMLButtonElement>
  onLikePointerUp: React.PointerEventHandler<HTMLButtonElement>
  onLikePointerLeave: React.PointerEventHandler<HTMLButtonElement>
  onSuperLikeClick: () => void
  /**
   * Открытие детальной карточки профиля.
   * Для высокой нагрузки колбэк желательно мемоизировать.
   */
  onOpenDetails?: () => void
}

const SwipeCardActionsComponent = ({
  compatibility = 0,
  onDislike,
  isSuperLikeMode,
  rootRef,
  onLikePointerDown,
  onLikePointerUp,
  onLikePointerLeave,
  onSuperLikeClick,
  onOpenDetails,
}: SwipeCardActionsProps): React.JSX.Element => {
  const clamped = Math.max(0, Math.min(100, Math.round(compatibility)))
  const angle = (clamped / 100) * 360

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto w-full flex items-center justify-center gap-[4%] px-4"
    >
      <Button
        type="button"
        variant="black"
        size="icon-xl"
        aria-label="Дизлайк"
        onClick={onDislike}
        className={cn(
          'aspect-square h-auto w-[22%] min-w-[80px] max-w-[95px] rounded-full p-0 flex items-center justify-center',
          'transition-transform duration-200 active:scale-95',
          isSuperLikeMode && 'blur-[2px]',
        )}
      >
        <X className="h-[45%] w-[45%] min-h-[35px] min-w-[35px]" strokeWidth={1.4} />
      </Button>

      <button
        type="button"
        className={cn(
          'relative h-auto w-[28%] min-w-[104px] max-w-[124px] aspect-square rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#FF6BA4]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          'transition-transform duration-200 active:scale-95',
          isSuperLikeMode && 'blur-[2px]',
        )}
        aria-label="Открыть подробную информацию"
        onClick={() => {
          if (!isSuperLikeMode) onOpenDetails?.()
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={
            {
              '--progress-angle': `${angle}deg`,
              backgroundImage:
                'conic-gradient(#FF6BA4 var(--progress-angle), transparent var(--progress-angle))',
              WebkitMaskImage:
                'radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 8px))',
              maskImage:
                'radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 5px))',
            } as React.CSSProperties
          }
          aria-hidden
        />

        <div className="relative m-[12px] flex h-[calc(100%-24px)] w-[calc(100%-24px)] items-center justify-center rounded-full bg-[#FF6BA4]">
          <span className="text-[24px] font-semibold text-white">{clamped}</span>
        </div>
      </button>

      <div className="relative aspect-square h-auto w-[22%] min-w-[80px] max-w-[95px]">
        <Button
          type="button"
          variant="black"
          size="icon-xl"
          aria-label="Лайк"
          onPointerDown={onLikePointerDown}
          onPointerUp={onLikePointerUp}
          onPointerLeave={onLikePointerLeave}
          className="group h-full w-full rounded-full p-0 flex items-center justify-center"
        >
          <Heart
            className="h-[45%] w-[45%] min-h-[35px] min-w-[35px] text-white transition-colors duration-150 group-active:text-[#FF6BA4] group-active:fill-[#FF6BA4]"
            fill="transparent"
            strokeWidth={1.4}
          />
        </Button>

        <AnimatePresence initial={false} mode="wait">
          {isSuperLikeMode && (
            <motion.div
              key="superlike"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="absolute -top-[110%] left-0 h-full w-full"
            >
              <Button
                type="button"
                size="icon-xl"
                aria-label="Суперлайк"
                onClick={onSuperLikeClick}
                className="h-full w-full rounded-full p-0 flex items-center justify-center transition-transform duration-200 active:scale-95"
              >
                <Flame
                  className="h-[45%] w-[45%] min-h-[35px] min-w-[35px]"
                  strokeWidth={1.4}
                  fill="white"
                />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export const SwipeCardActions = memo(SwipeCardActionsComponent)
