import { motion, type PanInfo } from 'framer-motion'
import { memo, useCallback, useEffect, useMemo } from 'react'

import { useFiltersMetadata } from '@/entities/user/hooks/useFiltersMetadata'
import { useRecordProfileView } from '@/entities/user/hooks/useRecordProfileView'
import { useUserProfile } from '@/entities/user/hooks/useUserProfile'
import { userFiltersToTraitDisplaySections } from '@/entities/user/lib/filterLabelByLanguage'
import { filterOptionIdsToUserFilters } from '@/entities/user/lib/filterOptionIdsToUserFilters'
import type { UserSearchApiUser } from '@/entities/user/types/types'
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

export interface MatchesOverlayProps {
  item: UserSearchApiUser
  onClose: () => void
  onLike?: () => void
  fromChat?: boolean
  fromRatings?: boolean
  receivedScore?: number
  myScore?: number | null
  onRate?: (score: number) => void
  /** Вызывается при клике на суперлайк; в аргументе — функция закрытия этого оверлея (для последующего закрытия после отправки огонька). */
  onSuperLike?: (closeParent: () => void) => void
}

const OverlayContent = ({
  item,
  onClose,
  onLike,
  fromChat,
  fromRatings,
  receivedScore,
  myScore,
  onRate,
  onSuperLike,
}: MatchesOverlayProps): React.JSX.Element => {
  const { data: filtersMetadata } = useFiltersMetadata()
  const { data: viewerProfile } = useUserProfile()
  const { mutate: recordProfileView } = useRecordProfileView()
  const viewerLanguage = viewerProfile?.language
  useEffect(() => {
    recordProfileView(item.user_id)
  }, [item.user_id, recordProfileView])

  const traitDisplaySections = useMemo(() => {
    const raw = item.filter_option_ids
    const ids = Array.isArray(raw) ? raw.map(String) : []
    if (!filtersMetadata?.length) {
      return []
    }
    const userFilters = filterOptionIdsToUserFilters(ids, filtersMetadata)
    return userFiltersToTraitDisplaySections(userFilters, filtersMetadata, viewerLanguage)
  }, [item.filter_option_ids, filtersMetadata, viewerLanguage])

  const {
    name,
    age,
    city,
    match_percentage,
    bio,
    relationship_goal,
    education_level,
    education_details,
    job_sphere,
    job,
  } = item

  const handleRate = useCallback(
    (score: number) => {
      onRate?.(score)
      onClose()
    },
    [onClose, onRate],
  )

  const handleLike = useCallback(() => {
    onLike?.()
    onClose()
  }, [onLike, onClose])

  const handleSuperLikeClick = useCallback(() => {
    onSuperLike?.(onClose)
  }, [onSuperLike, onClose])

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
  const handleOverlayDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 120 || info.velocity.y > 900) {
        onClose()
        return
      }
      handleDragEnd(event, info)
    },
    [handleDragEnd, onClose],
  )

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
        {/* Карусель на всю ширину оверлея — обрезка по краям экрана, не по узкому pill-контейнеру */}
        <motion.div
          className="absolute inset-x-0 z-20 overflow-hidden origin-top"
          style={{
            height: containerHeight,
            y: dragY,
          }}
        >
          <motion.div className="absolute inset-0" style={{ opacity: carouselOpacity }}>
            <div className={isExpanded ? 'pointer-events-none h-full' : 'h-full'}>
              <ProfilePeekCarousel
                images={item.photos}
                imageAlt={name}
                enabledImageSwiping={!isExpanded}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Пилюля мэтча — отдельный слой со своей шириной и скруглением */}
        <motion.div
          className="absolute z-30 overflow-hidden origin-top pointer-events-none"
          style={{
            height: containerHeight,
            width: containerWidth,
            borderRadius: containerRadius,
            left: '50%',
            x: '-50%',
            y: dragY,
          }}
        >
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
                {fromRatings && receivedScore != null
                  ? `${receivedScore}/10 Оценка`
                  : `${match_percentage}% Мэтч`}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium tracking-wide leading-none">
                {fromRatings ? 'Оценил вас' : 'Вы на одной волне'}
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
          dragConstraints={{ top: dragLimit, bottom: 260 }}
          dragControls={dragControls}
          dragElastic={0.1}
          dragListener={false}
          onDragEnd={handleOverlayDragEnd}
        >
          <MatchesCardContent
            name={name}
            age={age}
            city={city}
            bio={bio}
            reportedId={item.user_id}
            relationshipGoal={relationship_goal}
            educationDetails={education_details}
            educationLevel={education_level}
            jobSphere={job_sphere}
            job={job}
            traitDisplaySections={traitDisplaySections}
            fromChat={fromChat}
            fromRatings={fromRatings}
            myScore={myScore}
            onRate={handleRate}
            actionIndicator={
              <DragIndicator
                onPointerDown={(e) => dragControls.start(e)}
                onClick={handleIndicatorClick}
              />
            }
            onClose={onClose}
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
  item: UserSearchApiUser
  onLike?: () => void
  fromChat?: boolean
  fromRatings?: boolean
  receivedScore?: number
  myScore?: number | null
  onRate?: (score: number) => void
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
            onLike={options.onLike}
            fromChat={options.fromChat}
            fromRatings={options.fromRatings}
            receivedScore={options.receivedScore}
            myScore={options.myScore}
            onRate={options.onRate}
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
