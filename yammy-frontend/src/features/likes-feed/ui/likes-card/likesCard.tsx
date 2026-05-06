import { Heart } from 'lucide-react'
import { memo } from 'react'

import type { UserSearchResult } from '@/entities/user/types/types'
import { cn } from '@/shared'

export interface LikesCardProps {
  item: UserSearchResult
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
        <img
          src={photo}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute bottom-2 right-2 z-10 flex h-9 items-center gap-1.5 rounded-full bg-white px-3">
          <Heart size={16} strokeWidth={1.8} className="text-[#FF6BA4]" />
          <span className="text-[13px] font-medium leading-none text-[#FF6BA4]">
            {Math.round(matchPercentage)}%
          </span>
        </div>
      </div>

      <div className="mt-2 flex min-w-0 flex-col">
        <span className="truncate text-[17px] font-bold leading-tight text-white">
          {name}, {age}
        </span>
        <span className="truncate text-[13px] font-light leading-tight text-white/80">{city}</span>
      </div>
    </div>
  )
}

export const LikesCard = memo(LikesCardComponent)
