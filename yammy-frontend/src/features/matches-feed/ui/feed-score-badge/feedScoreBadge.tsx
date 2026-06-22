import { Blend, Heart } from 'lucide-react'
import { memo } from 'react'

import { cn } from '@/shared'

export interface FeedScoreBadgeProps {
  value: string
  className?: string
  variant?: 'match' | 'rating'
}

const FeedScoreBadgeComponent = ({
  value,
  className,
  variant = 'match',
}: FeedScoreBadgeProps): React.JSX.Element => {
  const Icon = variant === 'rating' ? Heart : Blend

  return (
    <div
      className={cn(
        'inline-flex h-9 items-center gap-1 rounded-full bg-black px-3 leading-none',
        className,
      )}
    >
      <Icon
        size={15}
        strokeWidth={1.8}
        aria-hidden
        className="block shrink-0 text-[#FF6BA4] -translate-y-px"
      />
      <span className="text-[13px] font-[200] leading-none text-[#FF6BA4] tabular-nums">{value}</span>
    </div>
  )
}

export const FeedScoreBadge = memo(FeedScoreBadgeComponent)
