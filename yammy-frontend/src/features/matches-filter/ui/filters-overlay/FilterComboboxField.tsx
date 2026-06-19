import { memo, useEffect, useMemo, useState } from 'react'

import { cn, Input } from '@/shared'

interface FilterComboboxFieldProps {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder: string
  ariaLabel: string
  /** Только выбор из списка; промежуточный ввод не уходит в onChange. */
  selectOnly?: boolean
}

const FilterComboboxFieldComponent = ({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  selectOnly = false,
}: FilterComboboxFieldProps): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const displayValue = selectOnly ? inputValue : value

  useEffect(() => {
    if (selectOnly) {
      setInputValue(value)
    }
  }, [selectOnly, value])

  const items = useMemo(() => {
    const normalized = displayValue.trim().toLowerCase()
    if (normalized === '') return [...options]
    return options.filter((option) => option.toLowerCase().includes(normalized))
  }, [displayValue, options])

  return (
    <div className="relative w-full">
      <Input
        type="text"
        value={displayValue}
        onChange={(event) => {
          const next = event.target.value
          if (selectOnly) {
            setInputValue(next)
            if (next === '') {
              onChange('')
            }
          } else {
            onChange(next)
          }
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false)
            if (selectOnly) {
              setInputValue(value)
            }
          }, 120)
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
        <div className="absolute top-[calc(100%+8px)] z-30 w-full overflow-hidden rounded-2xl bg-white">
          {items.length > 0 ? (
            <ul className="max-h-52 overflow-y-auto py-1">
              {items.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    className="w-full cursor-pointer px-4 py-2 text-left text-[13px] font-[200] text-[#141414] hover:bg-[#F2F2F2]"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (selectOnly) {
                        setInputValue(item)
                      }
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
            <p className="px-4 py-2 text-[13px] font-[200] text-neutral-500">Ничего не найдено</p>
          )}
        </div>
      )}
    </div>
  )
}

export const FilterComboboxField = memo(FilterComboboxFieldComponent)
