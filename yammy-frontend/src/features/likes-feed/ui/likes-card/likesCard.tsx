import { Heart } from 'lucide-react'
import { memo } from 'react'

import type { UserSearchApiUser } from '@/entities/user/types/types'
import { cn, Image } from '@/shared'

export interface LikesCardProps {
  item: UserSearchApiUser
  onClick?: () => void
  onLike?: (e: React.MouseEvent) => void
  onDislike?: (e: React.MouseEvent) => void
  className?: string
}

const LikesCardComponent = ({ item, onClick, className }: LikesCardProps): React.JSX.Element => {
  const { name, age, city, photos, match_percentage: matchPercentage } = item
  const photo = photos[0] ?? ''

  return (
    <div className={cn('w-full', className)}>
      <div
        role="button"
        tabIndex={0}
        className="group relative w-full aspect-[3/4] cursor-pointer overflow-hidden rounded-[24px] bg-card transition-all duration-200 active:scale-[0.98]"
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      >
        <Image
          src={photo}
          alt={name}
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute bottom-2 right-2 z-10 inline-flex h-9 items-center gap-1 rounded-full bg-black px-3 leading-none">
          <Heart
            size={16}
            strokeWidth={1.8}
            aria-hidden
            className="block shrink-0 text-[#FF6BA4] -translate-y-px"
          />
          <span className="text-[13px] font-[200] leading-none text-[#FF6BA4] tabular-nums">
            {Math.round(matchPercentage)}%
          </span>
        </div>
      </div>

      <div className="mt-2 flex min-w-0 flex-col ">
        <span className="truncate text-[16px] font-bold leading-tight text-white">
          {name}, {age}
        </span>
        <span className="truncate text-[13px] font-[160] leading-tight text-white/80">{city}</span>
      </div>
    </div>
  )
}

export const LikesCard = memo(LikesCardComponent)
