import { MessageCircle } from 'lucide-react'
import { memo } from 'react'

import { Button, cn } from '@/shared'

export interface RateCardActionsProps {
  onRate?: (rating: number) => void
  onMessage?: () => void
  className?: string
}

const RateCardActionsComponent = ({
  onRate,
  onMessage,
  className,
}: RateCardActionsProps): React.JSX.Element => {
  const ratings = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <div className={cn('pointer-events-auto w-full flex flex-col gap-3 px-2', className)}>
      <div className="grid grid-cols-5 gap-2 w-full">
        {ratings.map((rating) => (
          <Button
            key={rating}
            type="button"
            variant="ghost"
            size="icon"
            className="aspect-square h-auto w-full p-0 flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground font-normal transition-all duration-200 active:scale-95 rounded-[16px]"
            onClick={() => onRate?.(rating)}
          >
            {rating}
          </Button>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        className="w-full flex items-center justify-center gap-2 rounded-full bg-muted hover:bg-muted/80 text-foreground font-normal transition-all duration-200 h-12 active:scale-95"
        onClick={onMessage}
      >
        <MessageCircle size={20} strokeWidth={1.6} />
        Сообщение
      </Button>
    </div>
  )
}

export const RateCardActions = memo(RateCardActionsComponent)
