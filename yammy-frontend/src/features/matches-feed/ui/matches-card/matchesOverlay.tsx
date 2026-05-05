import { animate, motion, useSpring } from 'framer-motion'
import { ChevronLeft, Flag, Heart } from 'lucide-react'
import { memo, useCallback, useRef, useState } from 'react'

import { useSuperLikeInteractions } from '@/features/matches-feed/hooks/useSuperLikeInteractions'
import { Button, ImageCarousel, useOverlay } from '@/shared'

import type { UserSearchResult } from '@/entities/user/types/types'
import {
  MATCHES_OVERLAY_EASE_ENTER,
  MATCHES_OVERLAY_ENTER_DURATION,
  MATCHES_OVERLAY_INITIAL_ENTER_SCALE,
  MATCHES_OVERLAY_INITIAL_ENTER_Y,
} from '../../lib/constants'
import { SuperLikeOverlayContentMemo } from '../super-like-overlay/superLikeOverlay'
import { MatchesCardContent } from './matchesCard'

export interface MatchesOverlayProps {
  item: UserSearchResult
  onClose: () => void
  onDislike?: () => void
  onLike?: () => void
  /** Вызывается при клике на суперлайк; в аргументе — функция закрытия этого оверлея (для последующего закрытия после отправки огонька). */
  onSuperLike?: (closeParent: () => void) => void
}

const OverlayContent = ({
  item,
  onClose,
  onDislike,
  onLike,
  onSuperLike,
}: MatchesOverlayProps): React.JSX.Element => {
  const { name, age, city, photos, bio } = item
  const [reportTriggerKey, setReportTriggerKey] = useState(0)
  const pullDownY = useSpring(0, { stiffness: 360, damping: 34, mass: 0.55 })
  const swipeStartYRef = useRef<number | null>(null)

  const applySwipeResistance = useCallback((distance: number) => {
    if (distance <= 180) return distance * 0.72
    return 129.6 + (distance - 180) * 0.2
  }, [])

  const handleLike = useCallback(() => {
    onLike?.()
    onClose()
  }, [onLike, onClose])

  const handleSuperLikeClick = useCallback(() => {
    onSuperLike?.(onClose)
  }, [onSuperLike, onClose])

  const handleDislike = useCallback(() => {
    onDislike?.()
    onClose()
  }, [onDislike, onClose])

  const handleCloseSwipeStart = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    swipeStartYRef.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const handleCloseSwipeMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (swipeStartYRef.current == null) return

      const deltaY = Math.max(0, event.clientY - swipeStartYRef.current)
      pullDownY.set(applySwipeResistance(deltaY))
    },
    [applySwipeResistance, pullDownY],
  )

  const handleCloseSwipeEnd = useCallback(() => {
    const shouldClose = pullDownY.get() > 84

    swipeStartYRef.current = null
    if (shouldClose) {
      onClose()
      return
    }

    animate(pullDownY, 0, { duration: 0.24, ease: MATCHES_OVERLAY_EASE_ENTER })
  }, [onClose, pullDownY])

  const superLike = useSuperLikeInteractions({
    onLike: handleLike,
    onSuperLike: handleSuperLikeClick,
  })

  return (
    <motion.div
      className="box-border h-full w-full"
      style={{ y: pullDownY }}
      initial={{
        opacity: 0,
        y: MATCHES_OVERLAY_INITIAL_ENTER_Y,
        scale: MATCHES_OVERLAY_INITIAL_ENTER_SCALE,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: MATCHES_OVERLAY_ENTER_DURATION, ease: MATCHES_OVERLAY_EASE_ENTER },
      }}
    >
      <div className="relative flex h-full w-full min-h-0 justify-center">
        <div
          className="relative h-full w-full overflow-y-auto bg-background no-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="sticky top-0 z-40 flex justify-center bg-background px-6 pt-10">
            <button
              type="button"
              aria-label="Закрыть свайпом вниз"
              className="h-5 w-24 touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={handleCloseSwipeStart}
              onPointerMove={handleCloseSwipeMove}
              onPointerUp={handleCloseSwipeEnd}
              onPointerCancel={handleCloseSwipeEnd}
            >
              <span className="mx-auto block h-1 w-12 rounded-full bg-white" />
            </button>
          </div>

          <div className="w-full px-6 pt-1 pb-3">
            <div className="relative h-full w-full overflow-hidden rounded-[32px]">
              <div className="absolute left-4 right-4 top-4 z-30 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-12 w-12 rounded-full !bg-[#BC97FF]/35 !text-white !hover:bg-[#BC97FF]/50 !hover:text-white !active:bg-[#BC97FF]/60 !focus-visible:ring-[#BC97FF]/60 !focus-visible:border-transparent"
                  aria-label="Назад"
                  onClick={onClose}
                >
                  <ChevronLeft size={20} strokeWidth={1.8} aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-12 w-12 rounded-full !bg-[#BC97FF]/35 !text-white !hover:bg-[#BC97FF]/50 !hover:text-white !active:bg-[#BC97FF]/60 !focus-visible:ring-[#BC97FF]/60 !focus-visible:border-transparent"
                  aria-label="Пожаловаться"
                  onClick={() => setReportTriggerKey((value) => value + 1)}
                >
                  <Flag size={19} strokeWidth={1.8} aria-hidden />
                </Button>
              </div>

              <div className="h-[50vh] min-h-[300px] w-full">
              <ImageCarousel
                images={photos.length < 0 ? photos : ['/images/test.jpg', '/images/test1.jpg', '/images/test2.jpg']}
                imageAlt={name}
                isTop
                showIndicators={false}
                align="bottom"
                enabledImageSwiping
              />
              </div>

              <div className="absolute bottom-4 left-4 z-30 rounded-full bg-accent px-4 py-2 text-accent-foreground">
                <div className="flex items-center justify-center gap-1 leading-none">
                  <Heart size={18} strokeWidth={2} />
                  <span className="text-[16px] font-bold leading-none">{item.match_percentage}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full pb-6">
            <MatchesCardContent
              name={name}
              age={age}
              city={city}
              bio={bio}
              filters={item.filters}
              traits={item.traits}
              reportTriggerKey={reportTriggerKey}
              actionIndicator={null}
              onDislike={handleDislike}
              onSuperLikeClick={handleSuperLikeClick}
              superLikeHandlers={superLike}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const OverlayContentMemo = memo(OverlayContent)

type OpenProfileDetailsOptions = {
  item: UserSearchResult
  onDislike?: () => void
  onLike?: () => void
  onSuperLike?: (closeParent: () => void) => void
}

type OpenSuperLikeOverlayOptions = {
  onSend: (message: string) => void
  closeAlso?: () => void
}

export const useMatchesOverlay = () => {
  const { open, close } = useOverlay()

  const openProfileDetails = useCallback(
    (options: OpenProfileDetailsOptions) => {
      const overlayId = open({
        backdropClassName: 'bg-transparent backdrop-blur-0',
        panelClassName: 'relative w-full h-full',
        content: (closeOverlay) => (
          <OverlayContentMemo
            item={options.item}
            onDislike={options.onDislike}
            onLike={options.onLike}
            onSuperLike={options.onSuperLike}
            onClose={closeOverlay}
          />
        ),
      })

      return overlayId
    },
    [open],
  )

  const openSuperLikeOverlay = useCallback(
    (options: OpenSuperLikeOverlayOptions) => {
      const overlayId = open({
        panelClassName: 'relative w-full max-w-md flex items-end',
        content: (closeOverlay) => (
          <SuperLikeOverlayContentMemo
            onClose={closeOverlay}
            onSend={options.onSend}
            closeAlso={options.closeAlso}
          />
        ),
      })
      return overlayId
    },
    [open],
  )

  return {
    openProfileDetails,
    openSuperLikeOverlay,
    closeOverlay: close,
  }
}
