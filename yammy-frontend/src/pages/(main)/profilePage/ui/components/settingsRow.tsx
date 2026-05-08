import { ChevronRight } from 'lucide-react'
import type { JSX } from 'react'

interface SettingsRowProps {
  label: string
  value: string
}

export const SettingsRow = ({ label, value }: SettingsRowProps): JSX.Element => (
  <button
    type="button"
    className="flex w-full items-center gap-3 rounded-3xl bg-card px-4 py-4 text-left transition-colors hover:bg-card/85"
  >
    <span className="min-w-0 flex-1 text-[15px] font-[200] text-foreground">{label}</span>
    <span className="truncate text-[15px] font-[200] text-muted-foreground">{value}</span>
    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
  </button>
)
