import { memo } from 'react'

import { cn, Slider } from '@/shared'

import { PRIORITY_LABELS } from '../../lib/constants'

const PINK_SLIDER_CLASS = cn(
  '[&_[data-slot=slider-track]]:bg-[#E5E7EB] [&_[data-slot=slider-track]]:h-[2px]',
  '[&_[data-slot=slider-range]]:bg-primary',
  '[&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-primary [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:focus-visible:ring-primary/50',
)

interface PrioritySlidersProps {
  value: [number, number, number]
  onValueChange: (value: [number, number, number]) => void
}

const PrioritySlidersComponent = ({
  value,
  onValueChange,
}: PrioritySlidersProps): React.JSX.Element => {
  const setOne = (index: 0 | 1 | 2, v: number) => {
    const next = [...value] as [number, number, number]
    next[index] = v
    onValueChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      {PRIORITY_LABELS.map((label, i) => (
        <div key={label} className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-light text-black">{label}</span>
            <span className="text-[13px] font-medium text-primary tabular-nums">{value[i]}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[value[i] ?? 50]}
            onValueChange={(v) => setOne(i as 0 | 1 | 2, v[0] ?? 50)}
            className={PINK_SLIDER_CLASS}
            aria-label={label}
          />
        </div>
      ))}
    </div>
  )
}

export const PrioritySliders = memo(PrioritySlidersComponent)
