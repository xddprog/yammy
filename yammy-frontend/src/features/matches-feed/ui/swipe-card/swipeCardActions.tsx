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
      className="pointer-events-auto w-full flex items-center justify-between gap-[4%] px-10"
    >
      <Button
        type="button"
        variant="black"
        size="icon-xl"
        aria-label="Дизлайк"
        onClick={onDislike}
        className={cn(
          'aspect-square h-auto w-[18%] min-w-[55px] max-w-[70px] rounded-full p-0 flex items-center justify-center bg-[#371F7E] hover:bg-[#371F7E]/90',
          isSuperLikeMode && 'blur-[2px]',
        )}
      >
        <X className="h-[45%] w-[45%] min-h-[30px] min-w-[30px]" strokeWidth={1.2} />
      </Button>

      <button
        type="button"
        className={cn(
          'relative h-auto w-[20%] min-w-[90px] max-w-[110px] aspect-square rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
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
                'conic-gradient(var(--accent) var(--progress-angle), transparent var(--progress-angle))',
              WebkitMaskImage:
                'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
              maskImage:
                'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
            } as React.CSSProperties
          }
          aria-hidden
        />

        <div className="relative m-[5px] flex h-[calc(100%-10px)] w-[calc(100%-10px)] items-center justify-center rounded-full bg-accent">
          <span className="text-[20px] font-semibold text-accent-foreground">{clamped}</span>
        </div>
      </button>

      <div className="ml-[7px] relative aspect-square h-auto w-[18%] min-w-[55px] max-w-[70px]">
        <Button
          type="button"
          variant="default"
          size="icon-xl"
          aria-label="Лайк"
          onPointerDown={onLikePointerDown}
          onPointerUp={onLikePointerUp}
          onPointerLeave={onLikePointerLeave}
          className="h-full w-full rounded-full p-0 flex items-center justify-center bg-primary hover:bg-primary/90"
        >
          <Heart
            className="h-[40%] w-[40%] min-h-[30px] min-w-[30px] text-white"
            fill="white"
            strokeWidth={1.2}
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
                className="h-full w-full rounded-full p-0 flex items-center justify-center"
              >
                <Flame
                  className="h-[40%] w-[40%] min-h-[30px] min-w-[30px]"
                  strokeWidth={1.2}
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
