import { Search, X } from 'lucide-react'
import { useCallback, useState } from 'react'

import { cn } from '@/shared'

interface SearchBarProps {
  onSearch: (value: string) => void
  className?: string
}

export const SearchBar = ({ onSearch, className }: SearchBarProps) => {
  const [value, setValue] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    onSearch(newValue)
  }

  const handleClear = useCallback(() => {
    setValue('')
    onSearch('')
  }, [onSearch])

  return (
    <div className={cn('relative w-full', className)}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60">
        <Search size={18} strokeWidth={2} />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Поиск мэтчей..."
        className="h-12 w-full rounded-full bg-muted pl-11 pr-11 text-[15px] font-normal outline-none transition-all placeholder:text-muted-foreground/40 hover:bg-muted/80 focus:ring-2 focus:ring-primary/50"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
