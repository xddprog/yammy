import { memo } from 'react'

import { cn } from '@/shared'

export interface DragIndicatorProps {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  onClick?: () => void
  className?: string
}

const DragIndicatorComponent = ({
  onPointerDown,
  onClick,
  className,
}: DragIndicatorProps): React.JSX.Element => (
  <div
    className={cn(
      'flex shrink-0 cursor-grab justify-center pt-4 pb-2 active:cursor-grabbing touch-none z-20',
      className,
    )}
    onPointerDown={onPointerDown}
    onClick={onClick}
  >
    <span className="block h-1 w-9 shrink-0 rounded-full bg-neutral-300" />
  </div>
)

export const DragIndicator = memo(DragIndicatorComponent)
