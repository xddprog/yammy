import { memo } from 'react'

import { Button, cn } from '@/shared'

export interface RateCardActionsProps {
  onRate?: (rating: number) => void
  className?: string
}

const RateCardActionsComponent = ({
  onRate,
  className,
}: RateCardActionsProps): React.JSX.Element => {
  const ratings = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <div className={cn('pointer-events-auto w-full px-2', className)}>
      <div className="grid grid-cols-5 gap-2 w-full">
        {ratings.map((rating) => (
          <Button
            key={rating}
            type="button"
            variant="ghost"
            size="icon"
            className="aspect-square h-auto w-full p-0 flex items-center justify-center bg-card hover:bg-card/85 text-foreground font-normal transition-all duration-200 active:scale-95 rounded-[16px]"
            onClick={() => onRate?.(rating)}
          >
            {rating}
          </Button>
        ))}
      </div>
    </div>
  )
}

export const RateCardActions = memo(RateCardActionsComponent)
