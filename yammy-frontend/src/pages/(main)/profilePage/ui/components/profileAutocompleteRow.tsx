import { ChevronDown } from 'lucide-react'
import { memo, useState } from 'react'
import { cn } from '@/shared'

interface ProfileAutocompleteRowProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
  ariaLabel: string
}

const ProfileAutocompleteRowComponent = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Не указано',
  ariaLabel,
}: ProfileAutocompleteRowProps): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <div className="flex items-center justify-between rounded-[28px] bg-card px-4 py-7">
        <span className="text-[14px] font-[200] text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-[200] text-muted-foreground">
            {value.trim() === '' ? placeholder : value}
          </span>
          <button
            type="button"
            aria-label={ariaLabel}
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex size-6 items-center justify-center text-muted-foreground"
          >
            <ChevronDown className={cn('size-4 transition-transform', isOpen ? 'rotate-180' : '')} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] z-30 w-full overflow-hidden rounded-2xl bg-card">
          {options.length > 0 ? (
            <ul className="max-h-56 overflow-y-auto py-1">
              {options.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    className="w-full cursor-pointer px-4 py-2 text-left text-sm font-[200] text-foreground hover:bg-background/60"
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
            <p className="px-4 py-2 text-[13px] font-[200] text-muted-foreground">Ничего не найдено</p>
          )}
        </div>
      )}
    </div>
  )
}

export const ProfileAutocompleteRow = memo(ProfileAutocompleteRowComponent)
