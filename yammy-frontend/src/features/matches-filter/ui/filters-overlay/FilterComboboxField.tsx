import { memo, useMemo, useState } from 'react'

import { cn, Input } from '@/shared'

interface FilterComboboxFieldProps {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder: string
  ariaLabel: string
}

const FilterComboboxFieldComponent = ({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
}: FilterComboboxFieldProps): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)

  const items = useMemo(() => {
    const normalized = value.trim().toLowerCase()
    if (normalized === '') return [...options]
    return options.filter((option) => option.toLowerCase().includes(normalized))
  }, [options, value])

  return (
    <div className="relative w-full">
      <Input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 120)
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          'w-full rounded-full border border-[#F2F2F2] bg-[#F2F2F2] shadow-none',
          '!h-[42px] min-h-0 px-4 py-[18px] text-[13px] font-light leading-none text-[#141414]',
          '!placeholder:text-[13px] !placeholder:font-light !placeholder:leading-none',
          '!placeholder:text-[#141414] !placeholder:opacity-100',
          'focus-visible:border-[#FF6BA4]/30 focus-visible:ring-0',
        )}
      />

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] z-30 w-full overflow-hidden rounded-2xl border border-[#14141426] bg-white ring-1 ring-[#141414]/10">
          {items.length > 0 ? (
            <ul className="max-h-52 overflow-y-auto py-1">
              {items.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    className="w-full cursor-pointer px-4 py-2 text-left text-[13px] text-[#141414] hover:bg-[#F2F2F2]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(item)
                      setIsOpen(false)
                    }}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-2 text-[13px] text-neutral-500">Ничего не найдено</p>
          )}
        </div>
      )}
    </div>
  )
}

export const FilterComboboxField = memo(FilterComboboxFieldComponent)
