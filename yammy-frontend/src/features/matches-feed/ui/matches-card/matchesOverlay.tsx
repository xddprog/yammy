import { motion } from 'framer-motion'
import { memo, useCallback } from 'react'

import { useContentAreaHeight } from '@/features/matches-feed/hooks/useContentAreaHeight'
import { useMatchesOverlayMotion } from '@/features/matches-feed/hooks/useMatchesOverlayMotion'
import { useSuperLikeInteractions } from '@/features/matches-feed/hooks/useSuperLikeInteractions'
import { ImageCarousel, useOverlay } from '@/shared'

import type { UserSearchResult } from '@/entities/user/types/types'
import {
  MATCHES_OVERLAY_EASE_ENTER,
  MATCHES_OVERLAY_ENTER_DURATION,
  MATCHES_OVERLAY_INITIAL_ENTER_SCALE,
  MATCHES_OVERLAY_INITIAL_ENTER_Y,
  MATCHES_OVERLAY_PADDING_HORIZONTAL_PX,
  MATCHES_OVERLAY_PADDING_VERTICAL_PX,
} from '../../lib/constants'
import { DragIndicator } from '../sheet-card'
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
  const { name, age, city, photos, match_percentage, bio } = item

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

  const superLike = useSuperLikeInteractions({
    onLike: handleLike,
    onSuperLike: handleSuperLikeClick,
  })

  const { ref: contentAreaRef, heightPx: contentAreaHeightPx, widthPx: contentAreaWidthPx } = useContentAreaHeight()
  const motionProps = useMatchesOverlayMotion(contentAreaHeightPx, contentAreaWidthPx)
  const {
    dragY,
    dragControls,
    isExpanded,
    cardInitialTop,
    dragLimit,
    containerHeight,
    containerWidth,
    containerRadius,
    carouselOpacity,
    pillContentOpacity,
    pillContentScale,
    cardMarginTop,
    cardHeight,
    handleDragEnd,
    handleIndicatorClick,
  } = motionProps

  return (
    <motion.div
      className="box-border w-full h-full pointer-events-none"
      style={{
        paddingTop: MATCHES_OVERLAY_PADDING_VERTICAL_PX,
        paddingBottom: 0,
      }}
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
      <div
        ref={contentAreaRef}
        className="relative w-full h-full min-h-0 pointer-events-auto flex justify-center"
      >
        <motion.div
          className="absolute z-20 overflow-hidden origin-top
                     bg-black/40 backdrop-blur-xl border border-white/10"
          style={{
            height: containerHeight,
            width: containerWidth,
            borderRadius: containerRadius,
            left: '50%',
            x: '-50%',
          }}
        >
          <motion.div className="absolute inset-0" style={{ opacity: carouselOpacity }}>
            <div className={isExpanded ? 'pointer-events-none h-full' : 'h-full'}>
              <ImageCarousel
                images={photos}
                imageAlt={name}
                isTop
                showIndicators
                align="bottom"
                enabledImageSwiping={!isExpanded}
              />
            </div>
          </motion.div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center gap-2"
            style={{ opacity: pillContentOpacity, scale: pillContentScale }}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pink-500/80 p-1">
              <img
                src="/images/logo.png"
                alt="Yammy"
                className="h-full w-full object-contain object-center"
              />
            </div>
            <div className="flex min-w-0 flex-col leading-[1.1]">
              <span className="text-[14px] font-bold text-white tracking-tight">
                {match_percentage}% Мэтч
              </span>
              <span className="text-[10px] text-neutral-400 font-medium tracking-wide leading-none">
                Вы на одной волне
              </span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute left-0 right-0 z-10 flex flex-col"
          style={{
            top: cardInitialTop,
            y: dragY,
            height: cardHeight,
            boxSizing: 'border-box',
            paddingTop: cardMarginTop,
            paddingLeft: MATCHES_OVERLAY_PADDING_HORIZONTAL_PX,
            paddingRight: MATCHES_OVERLAY_PADDING_HORIZONTAL_PX,
          }}
          drag="y"
          dragConstraints={{ top: dragLimit, bottom: 0 }}
          dragControls={dragControls}
          dragElastic={0.1}
          dragListener={false}
          onDragEnd={handleDragEnd}
        >
          <MatchesCardContent
            name={name}
            age={age}
            city={city}
            bio={bio}
            actionIndicator={
              <DragIndicator
                onPointerDown={(e) => dragControls.start(e)}
                onClick={handleIndicatorClick}
              />
            }
            onDislike={handleDislike}
            onSuperLikeClick={handleSuperLikeClick}
            superLikeHandlers={superLike}
          />
        </motion.div>
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
        panelClassName: 'relative w-full max-w-md h-full',
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
