import { memo } from 'react'

import { Button, cn } from '@/shared'

export interface RateCardActionsProps {
  onRate?: (rating: number) => void
  className?: string
  tone?: 'card' | 'black'
  disabled?: boolean
}

const RateCardActionsComponent = ({
  onRate,
  className,
  tone = 'card',
  disabled = false,
}: RateCardActionsProps): React.JSX.Element => {
  const ratings = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <div className={cn('pointer-events-auto w-full flex items-center justify-center px-4', className)}>
      <div className="grid w-full max-w-[min(100%,420px)] grid-cols-5 gap-2">
        {ratings.map((rating) => (
          <Button
            key={rating}
            type="button"
            variant={tone === 'black' ? 'black' : 'ghost'}
            size="icon"
            disabled={disabled}
            className={cn(
              'aspect-square h-auto w-full p-0 flex items-center justify-center font-normal transition-all duration-200 active:scale-95 rounded-[16px]',
              tone === 'black'
                ? 'text-white'
                : 'bg-card hover:bg-card/85 text-foreground',
            )}
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
