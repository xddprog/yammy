import { memo } from 'react'

import { cn } from '@/shared'

const CHIP_BASE =
  'shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-light transition-colors touch-manipulation cursor-pointer select-none border border-transparent'

interface FilterChipGroupProps<T extends string> {
  options: readonly T[]
  value: T[]
  onChange: (value: T[]) => void
  multiple?: boolean
  'aria-label': string
}

function FilterChipGroupInner<T extends string>({
  options,
  value,
  onChange,
  multiple = true,
  'aria-label': ariaLabel,
}: FilterChipGroupProps<T>): React.JSX.Element {
  const toggle = (option: T) => {
    if (multiple) {
      const next = value.includes(option) ? value.filter((v) => v !== option) : [...value, option]
      onChange(next as T[])
    } else {
      onChange(value.includes(option) ? [] : [option])
    }
  }

  return (
    <div
      className="-mx-6 w-auto min-w-0 max-w-none overflow-x-auto overflow-y-hidden px-6 no-scrollbar"
      role="group"
      aria-label={ariaLabel}
    >
      <div className="inline-flex min-w-max gap-2 pr-1">
        {options.map((option) => {
          const selected = value.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                CHIP_BASE,
                selected
                  ? 'bg-[#FF6BA4]/20 text-[#141414] border-[#FF6BA4]/40'
                  : 'bg-[#F2F2F2] text-[#141414] hover:bg-[#E5E5E5]',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const FilterChipGroup = memo(FilterChipGroupInner) as typeof FilterChipGroupInner
