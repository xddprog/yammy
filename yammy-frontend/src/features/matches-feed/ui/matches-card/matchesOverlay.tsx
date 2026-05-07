import { motion } from 'framer-motion'
import { memo, useCallback } from 'react'

import type { UserSearchResult } from '@/entities/user/types/types'
import { useContentAreaHeight } from '@/features/matches-feed/hooks/useContentAreaHeight'
import { useMatchesOverlayMotion } from '@/features/matches-feed/hooks/useMatchesOverlayMotion'
import { useSuperLikeInteractions } from '@/features/matches-feed/hooks/useSuperLikeInteractions'
import { useOverlay } from '@/shared'

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
import { ProfilePeekCarousel } from './profilePeekCarousel'

const MOCK_DETAIL_PHOTOS = [
  '/images/photo_2025-12-23_22-41-09.jpg',
  '/images/photo_2025-12-16_22-32-35.jpg',
  '/images/photo_2025-04-10_00-42-15.jpg',
]

export interface MatchesOverlayProps {
  item: UserSearchResult
  onClose: () => void
  onDislike?: () => void
  onLike?: () => void
  fromChat?: boolean
  /** Вызывается при клике на суперлайк; в аргументе — функция закрытия этого оверлея (для последующего закрытия после отправки огонька). */
  onSuperLike?: (closeParent: () => void) => void
}

const OverlayContent = ({
  item,
  onClose,
  onDislike,
  onLike,
  fromChat,
  onSuperLike,
}: MatchesOverlayProps): React.JSX.Element => {
  const {
    name,
    age,
    city,
    match_percentage,
    bio,
    relationship_goal,
    education_details,
    job_sphere,
    job,
    filters,
  } = item

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

  const {
    ref: contentAreaRef,
    heightPx: contentAreaHeightPx,
    widthPx: contentAreaWidthPx,
  } = useContentAreaHeight()
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
    pillPaddingTop,
    cardMarginTop,
    cardHeight,
    handleDragEnd,
    handleIndicatorClick,
  } = motionProps
  const detailPhotos = MOCK_DETAIL_PHOTOS

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
          className="absolute z-20 overflow-hidden origin-top"
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
              <ProfilePeekCarousel
                images={detailPhotos}
                imageAlt={name}
                enabledImageSwiping={!isExpanded}
              />
            </div>
          </motion.div>

          <motion.div
            className="absolute inset-0 box-border flex items-center justify-center gap-2"
            style={{
              opacity: pillContentOpacity,
              scale: pillContentScale,
              paddingTop: pillPaddingTop,
            }}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FF6BA4] p-1">
              <img
                src="/images/logo.svg"
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
            relationshipGoal={relationship_goal}
            educationDetails={education_details}
            jobSphere={job_sphere}
            job={job}
            userFilters={filters}
            fromChat={fromChat}
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
  fromChat?: boolean
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
            fromChat={options.fromChat}
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
