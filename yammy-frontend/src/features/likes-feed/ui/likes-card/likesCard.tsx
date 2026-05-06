import { Heart, X } from 'lucide-react'
import { memo, useCallback } from 'react'

import type { UserSearchResult } from '@/entities/user/types/types'
import { Button, cn } from '@/shared'

export interface LikesCardProps {
  item: UserSearchResult
  onClick?: () => void
  onLike?: (e: React.MouseEvent) => void
  onDislike?: (e: React.MouseEvent) => void
  className?: string
}

const LikesCardComponent = ({
  item,
  onClick,
  onLike,
  onDislike,
  className,
}: LikesCardProps): React.JSX.Element => {
  const { name, age, photos } = item
  const photo = photos[0] ?? ''

  const handleAction = useCallback(
    (e: React.MouseEvent, action?: (e: React.MouseEvent) => void) => {
      e.stopPropagation()
      action?.(e)
    },
    [],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'relative w-full aspect-[3/4] overflow-hidden rounded-[24px] bg-card shadow-md group cursor-pointer border border-white/5 active:scale-[0.98] transition-all duration-200',
        className,
      )}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <img
        src={photo}
        alt={name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      <div
        className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
        }}
      />

      <div className="absolute inset-x-0 bottom-0 p-2 flex flex-col gap-1 z-10">
        <div className="flex flex-col min-w-0">
          <span className="text-[17px] font-bold text-white truncate drop-shadow-sm leading-tight">
            {name}, {age}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full">
          <Button
            type="button"
            variant="black"
            className="flex-1 h-9 rounded-full bg-black hover:bg-black/90 text-white transition-all active:scale-[0.95] border border-white/10 p-0 flex items-center justify-center"
            onClick={(e) => handleAction(e, onDislike)}
          >
            <X size={18} strokeWidth={2.5} />
          </Button>
          <Button
            type="button"
            variant="black"
            className="group flex-1 h-9 rounded-full bg-black hover:bg-black/90 transition-all active:scale-[0.95] border border-white/10 p-0 flex items-center justify-center"
            onClick={(e) => handleAction(e, onLike)}
          >
            <Heart
              size={18}
              strokeWidth={2.5}
              className="text-[#FF6BA4] transition-colors duration-200 group-active:fill-[#FF6BA4]"
            />
          </Button>
        </div>
      </div>
    </div>
  )
}

export const LikesCard = memo(LikesCardComponent)
