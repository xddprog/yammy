import { Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

import { cn } from '@/shared'

interface ChatsSearchFieldProps {
  value: string
  onChange: (value: string) => void
  className?: string
  /** Без иконки лупы слева — для строки в хедере */
  inline?: boolean
  autoFocus?: boolean
}

export const ChatsSearchField = ({
  value,
  onChange,
  className,
  inline = false,
  autoFocus = false,
}: ChatsSearchFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [autoFocus])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  return (
    <div className={cn('relative w-full min-w-0', className)}>
      {!inline && (
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search size={18} strokeWidth={2} />
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Поиск"
        className={cn(
          'h-11 w-full min-w-0 rounded-full border-0 bg-card text-[15px] font-[200] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:ring-0',
          inline ? 'pl-4 pr-10' : 'pl-11 pr-11',
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Очистить поле"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  )
}
