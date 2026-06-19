import { formatDateOnly } from '@/shared/lib/utils'

type ChartTooltipProps = {
  active?: boolean
  payload?: ReadonlyArray<{ value?: unknown }>
  label?: string | number
  valueLabel: string
}

export function ChartTooltip({ active, payload, label, valueLabel }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const raw = payload[0]?.value
  const value = Array.isArray(raw) ? Number(raw[0] ?? 0) : Number(raw ?? 0)
  const dateStr = label != null && label !== '' ? formatDateOnly(String(label)) : '—'

  return (
    <div className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm shadow-xl">
      <p className="text-zinc-400">{dateStr}</p>
      <p className="mt-1 font-semibold text-white">
        {valueLabel}: {value.toLocaleString('ru-RU')}
      </p>
    </div>
  )
}
