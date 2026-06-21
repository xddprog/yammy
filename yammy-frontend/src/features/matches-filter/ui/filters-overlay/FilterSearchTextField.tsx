import { memo, useCallback, useLayoutEffect, useRef } from 'react'

import { cn } from '@/shared'

export const SEARCH_TEXT_MAX_LEN = 150

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autosize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useLayoutEffect(() => {
    autosize()
  }, [autosize, value])

  return (
    <div
      className={cn(
        'flex w-full min-h-[42px] items-center rounded-full border border-[#F2F2F2] bg-white px-4 shadow-none',
        'focus-within:border-[#FF6BA4]/30',
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value.slice(0, SEARCH_TEXT_MAX_LEN))
          requestAnimationFrame(autosize)
        }}
        placeholder={placeholder}
        rows={1}
        aria-label={ariaLabel}
        className={cn(
          'w-full resize-none overflow-hidden border-0 bg-transparent p-0 shadow-none outline-none ring-0',
          'text-[13px] font-light leading-none text-[#141414]',
          '!placeholder:text-[13px] !placeholder:font-light !placeholder:leading-none',
          '!placeholder:text-[#141414] !placeholder:opacity-100',
        )}
      />
    </div>
  )
}

export const FilterSearchTextField = memo(FilterSearchTextFieldComponent)
