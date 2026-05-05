import { memo } from 'react'

import { cn } from '@/shared'

const OPTION_BASE =
  'flex-1 rounded-full px-4 py-2.5 text-sm font-light transition-colors touch-manipulation cursor-pointer select-none border border-transparent'

interface FilterRadioGroupProps<T extends string> {
  options: readonly [T, T, ...T[]]
  value: T | null
  onChange: (value: T | null) => void
  'aria-label': string
}

function FilterRadioGroupInner<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: FilterRadioGroupProps<T>): React.JSX.Element {
  return (
    <div className="flex gap-2" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(selected ? null : option)}
            className={cn(
              OPTION_BASE,
              selected
                ? 'bg-primary/20 text-[#141414] border-primary/40'
                : 'bg-muted/45 text-[#141414] hover:bg-muted/65',
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

export const FilterRadioGroup = memo(FilterRadioGroupInner) as typeof FilterRadioGroupInner
