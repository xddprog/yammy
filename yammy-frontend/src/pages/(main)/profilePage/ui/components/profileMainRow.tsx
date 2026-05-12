import { SquarePen } from 'lucide-react'
import type { JSX } from 'react'

import { Image } from '@/shared'

import { PROFILE_COMPLETENESS_RING_VISUAL_PERCENT } from './profile.constants'

const RING_SIZE = 66
const RING_CENTER = RING_SIZE / 2
const RING_STROKE = 4
/** Радиус до центра линии обводки (кольцо у внешнего края блока). */
const RING_RADIUS = RING_SIZE / 2 - RING_STROKE / 2 - 1

/** Диаметр круга аватарки (px). */
const AVATAR_SIZE = 48

interface ProfileMainRowProps {
  avatarUrl: string
  title: string
  onOpenEdit: () => void
}

export const ProfileMainRow = ({
  avatarUrl,
  title,
  onOpenEdit,
}: ProfileMainRowProps): JSX.Element => {
  const circumference = 2 * Math.PI * RING_RADIUS
  const dashOffset =
    circumference * (1 - PROFILE_COMPLETENESS_RING_VISUAL_PERCENT / 100)

  return (
    <button
      type="button"
      onClick={onOpenEdit}
      className="flex w-full items-center gap-3 rounded-[28px] bg-card px-4 py-4.5 text-left transition-colors hover:bg-card/85"
      aria-label="Редактировать профиль"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <div
            className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
          >
            <Image
              src={avatarUrl}
              alt={`Фото профиля: ${title}`}
              className="block size-full min-h-0 min-w-0 object-cover"
            />
          </div>
          <svg
            className="pointer-events-none absolute inset-0 z-10 size-full -rotate-90"
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            aria-hidden
          >
            <circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              fill="none"
              stroke="#FF6BA4"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
        </div>
        <span className="truncate text-[14px] font-[200] text-foreground">{title}</span>
      </div>
      <SquarePen
        className="size-4 shrink-0 text-muted-foreground"
        strokeWidth={0.5}
        aria-hidden
      />
    </button>
  )
}
