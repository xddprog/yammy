import { Flame } from 'lucide-react'
import { memo } from 'react'

import type { UserSearchApiUser } from '@/entities/user/types/types'
import { cn } from '@/shared'

export interface SuperLikeCardProps {
  item: UserSearchApiUser
  onClick?: () => void
  className?: string
}

const SuperLikeCardComponent = ({
  item,
  onClick,
  className,
}: SuperLikeCardProps): React.JSX.Element => {
  const { name, age, city, photos, like_message: message } = item
  const photo = photos[0] ?? ''
  const displayMessage = message?.trim()

  return (
    <div className={cn('w-full', className)}>
      <div
        role="button"
        tabIndex={0}
        className="group relative min-h-[260px] w-full cursor-pointer overflow-hidden rounded-[28px] bg-card transition-all duration-200 active:scale-[0.99]"
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      >
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-card" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#FF6BA4] px-3 py-1.5 text-sm font-semibold text-white">
          <Flame className="size-4" strokeWidth={1.8} fill="white" />
          Огонек
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 text-white">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[22px] font-bold leading-tight">
              {name}, {age}
            </span>
            <span className="truncate text-[14px] font-[160] leading-tight text-white/80">
              {city}
            </span>
          </div>
          {displayMessage && (
            <p className="rounded-[20px] bg-white/14 px-4 py-3 text-[15px] font-medium leading-snug text-white backdrop-blur-md">
              {displayMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export const SuperLikeCard = memo(SuperLikeCardComponent)
