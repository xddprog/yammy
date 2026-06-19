import { memo } from 'react'

import { cn } from '@/shared'

const SEARCH_TEXT_MAX_LEN = 500

interface FilterSearchTextFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel: string
}

const FilterSearchTextFieldComponent = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: FilterSearchTextFieldProps): React.JSX.Element => {
  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, SEARCH_TEXT_MAX_LEN))}
        placeholder={placeholder}
        rows={3}
        aria-label={ariaLabel}
        className={cn(
          'w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900',
          'outline-none placeholder:text-neutral-400 focus-visible:border-[#FF6BA4] focus-visible:ring-2 focus-visible:ring-[#FF6BA4]/20',
        )}
      />
      <p className="mt-1 text-right text-[11px] text-neutral-400">
        {value.length}/{SEARCH_TEXT_MAX_LEN}
      </p>
    </div>
  )
}

export const FilterSearchTextField = memo(FilterSearchTextFieldComponent)
