import { memo } from 'react'

import { cn, Input } from '@/shared'

import { CITY_PLACEHOLDER } from '../../lib/constants'

interface CityInputProps {
  value: string
  onChange: (value: string) => void
}

const CityInputComponent = ({ value, onChange }: CityInputProps): React.JSX.Element => (
  <div className="relative">
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={CITY_PLACEHOLDER}
      className={cn(
        'rounded-full border border-muted bg-muted/45 font-light placeholder:text-[13px] placeholder:font-light px-4 py-5 text-[13px] text-[#141414]',
        'placeholder:text-neutral-500 focus-visible:ring-0 focus-visible:border-primary/30',
      )}
      aria-label="Город"
    />
  </div>
)

export const CityInput = memo(CityInputComponent)
