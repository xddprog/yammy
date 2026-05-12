import { memo } from 'react'

import { cn, Slider } from '@/shared'

import {
  AGE_ABSOLUTE_MAX,
  AGE_ABSOLUTE_MIN,
  AGE_DEFAULT_MAX,
  AGE_DEFAULT_MIN,
} from '../../lib/constants'

const PINK_SLIDER_CLASS = cn(
  '[&_[data-slot=slider-track]]:bg-[#E5E7EB] [&_[data-slot=slider-track]]:h-[2px]',
  '[&_[data-slot=slider-range]]:bg-[#FF6BA4]',
  '[&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-[#FF6BA4] [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:focus-visible:ring-[#FF6BA4]/50',
)

interface AgeRangeSliderProps {
  value: [number, number]
  onValueChange: (value: [number, number]) => void
}

const AgeRangeSliderComponent = ({
  value,
  onValueChange,
}: AgeRangeSliderProps): React.JSX.Element => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] font-light text-black">От — до (лет)</span>
      <span className="text-[13px] font-medium text-[#FF6BA4] tabular-nums">
        {value[0]} — {value[1]}
      </span>
    </div>
    <Slider
      min={AGE_ABSOLUTE_MIN}
      max={AGE_ABSOLUTE_MAX}
      step={1}
      value={value}
      onValueChange={(v) => onValueChange([v[0] ?? AGE_DEFAULT_MIN, v[1] ?? AGE_DEFAULT_MAX])}
      className={PINK_SLIDER_CLASS}
      aria-label="Диапазон возраста"
    />
  </div>
)

export const AgeRangeSlider = memo(AgeRangeSliderComponent)
