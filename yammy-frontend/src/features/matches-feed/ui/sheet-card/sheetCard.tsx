import { memo } from 'react'

import { cn } from '@/shared'

import { SHEET_CARD_SHADOW } from '../../lib/constants'

export interface SheetCardProps {
  indicator: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
  footerClassName?: string
  style?: React.CSSProperties
}

const SheetCardComponent = ({
  indicator,
  children,
  footer,
  className,
  contentClassName,
  footerClassName,
  style,
}: SheetCardProps): React.JSX.Element => (
  <div
    className={cn(
      'flex flex-col overflow-hidden rounded-[48px] bg-white text-black',
      SHEET_CARD_SHADOW,
      className,
    )}
    style={style}
  >
    {indicator}
    <div className={cn('flex min-h-0 flex-1 flex-col', contentClassName)}>
      {children}
    </div>
    {footer != null ? (
      <div className={cn('shrink-0', footerClassName)}>{footer}</div>
    ) : null}
  </div>
)

export const SheetCard = memo(SheetCardComponent)
