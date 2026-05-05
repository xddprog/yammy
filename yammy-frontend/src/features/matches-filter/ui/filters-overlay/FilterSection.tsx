import type { ReactNode } from 'react'

import { cn } from '@/shared'

interface FilterSectionProps {
  /** Подпись к полю (серый текст, один стиль для всех заголовков) */
  label?: string
  children?: ReactNode
  className?: string
}

export const FilterSection = ({
  label,
  children,
  className,
}: FilterSectionProps): React.JSX.Element => (
  <section className={cn('flex flex-col gap-3', className)}>
    {label != null && label !== '' && (
      <p className="text-sm font-normal text-neutral-500">{label}</p>
    )}
    {children != null ? children : null}
  </section>
)
