import { memo } from 'react'

import { cn, Switch } from '@/shared'

interface PremiumToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

const PremiumToggleComponent = ({
  checked,
  onCheckedChange,
}: PremiumToggleProps): React.JSX.Element => (
  <div
    className={cn(
      'flex w-full items-center justify-between gap-3 rounded-4xl border border-transparent px-4 py-3',
      'bg-muted/45 hover:bg-muted/65 transition-colors',
    )}
  >
    <span className="flex items-center gap-2 text-[13px] font-light text-black">
      Только Premium
    </span>
    <Switch
      size="lg"
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label="Только Premium"
      className="data-[state=checked]:bg-primary data-[state=unchecked]:!bg-neutral-300 [&_[data-slot=switch-thumb]]:!bg-white"
    />
  </div>
)

export const PremiumToggle = memo(PremiumToggleComponent)
