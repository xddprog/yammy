import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { fetchStatsOverview, type StatsOverviewParams } from '@/entities/admin-auth/api'
import { Card, Input } from '@/shared/ui/primitives'
import { ChartTooltip } from '@/shared/ui/chartTooltip'
import { useMemo, useState } from 'react'
import { labelReportReason, t } from '@/shared/lib/labels'
import { daysAgoDateInput, formatDateInput, formatDateOnly } from '@/shared/lib/utils'

type StatsMode = StatsOverviewParams['mode']

const chartAxisProps = {
  tick: { fill: '#a1a1aa', fontSize: 12 },
  axisLine: { stroke: '#52525b' },
  tickLine: { stroke: '#52525b' },
} as const

export function DashboardPage() {
  const [mode, setMode] = useState<StatsMode>('preset')
  const [period, setPeriod] = useState('30d')
  const [dateFrom, setDateFrom] = useState(() => daysAgoDateInput(29))
  const [dateTo, setDateTo] = useState(() => formatDateInput())

  const statsParams = useMemo<StatsOverviewParams>(() => {
    if (mode === 'custom') {
      return { mode: 'custom', date_from: dateFrom, date_to: dateTo }
    }
    return { mode: 'preset', period }
  }, [mode, period, dateFrom, dateTo])

  const rangeValid = mode === 'preset' || (dateFrom !== '' && dateTo !== '' && dateFrom <= dateTo)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-stats', statsParams],
    queryFn: () => fetchStatsOverview(statsParams),
    enabled: rangeValid,
  })

  if (isLoading || !data) {
    return <div className="text-zinc-400">{t.loadingDashboard}</div>
  }

  const cards: Array<{ label: string; value: number; hint?: string }> = [
    { label: t.statTotalUsers, value: data.cards.total_users },
    { label: t.statNewUsers, value: data.cards.new_users_period },
    { label: t.statDau, value: data.cards.dau, hint: t.statDauHint },
    { label: t.statWau, value: data.cards.wau, hint: t.statWauHint },
    { label: t.statMau, value: data.cards.mau, hint: t.statMauHint },
    { label: t.statMatches, value: data.cards.total_matches },
    { label: t.statMessages, value: data.cards.messages_period },
    { label: t.statReports, value: data.cards.reports_period },
    { label: t.statPendingModeration, value: data.pending_moderation },
  ]

  const rangeLabel =
    data.date_from && data.date_to
      ? `${formatDateOnly(data.date_from)} — ${formatDateOnly(data.date_to)}`
      : `${data.period_days} ${t.periodDaysSuffix}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t.dashboard}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t.statsRangeHint}: {rangeLabel}</p>
          <p className="mt-1 text-xs text-zinc-600">{t.statsNotRealtimeHint}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? t.refreshingStats : t.refreshStats}
          </button>
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as StatsMode)}
          >
            <option value="preset">{t.periodPreset}</option>
            <option value="custom">{t.periodCustom}</option>
          </select>
          {mode === 'preset' ? (
            <select
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="1d">{t.period1d}</option>
              <option value="7d">{t.period7d}</option>
              <option value="30d">{t.period30d}</option>
              <option value="90d">{t.period90d}</option>
            </select>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                {t.dateFrom}
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                {t.dateTo}
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </label>
            </>
          )}
        </div>
      </div>
      {mode === 'custom' && !rangeValid && (
        <p className="text-sm text-red-400">{t.invalidDateRange}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <div className="text-xs uppercase text-zinc-500">{card.label}</div>
            <div className="mt-1 text-2xl font-semibold">{card.value}</div>
            {card.hint && <p className="mt-2 text-xs leading-snug text-zinc-500">{card.hint}</p>}
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-medium">{t.chartRevenue}</h2>
          <p className="mb-3 text-xs text-zinc-500">{t.revenueHint}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monetization.revenue_by_day}>
                <XAxis dataKey="date" hide />
                <YAxis {...chartAxisProps} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(113, 113, 122, 0.2)' }}
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      payload={payload}
                      label={label}
                      valueLabel={t.chartTooltipRevenue}
                    />
                  )}
                />
                <Bar dataKey="value" fill="#fbbf24" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-medium">{t.chartEngagement}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.engagement.messages}>
                <XAxis dataKey="date" hide />
                <YAxis {...chartAxisProps} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(113, 113, 122, 0.2)' }}
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      payload={payload}
                      label={label}
                      valueLabel={t.chartTooltipMessages}
                    />
                  )}
                />
                <Bar dataKey="value" fill="#a1a1aa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-medium">{t.chartRegistrations}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.growth.registrations}>
                <XAxis dataKey="date" hide />
                <YAxis {...chartAxisProps} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: '#71717a' }}
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      payload={payload}
                      label={label}
                      valueLabel={t.chartTooltipRegistrations}
                    />
                  )}
                />
                <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="mb-2 font-medium">{t.blockSubscriptions}</h3>
          <p>{t.tierFree}: {data.monetization.tier_free}</p>
          <p>{t.tierVip}: {data.monetization.tier_vip}</p>
          <p>{t.tierPremium}: {data.monetization.tier_premium}</p>
          <div className="mt-4 space-y-1 border-t border-zinc-800 pt-4 text-sm">
            <p>{t.revenuePeriod}: {data.monetization.revenue_period.toLocaleString('ru-RU')} ₽</p>
            <p className="text-zinc-400">{t.revenueTotal}: {data.monetization.revenue_total.toLocaleString('ru-RU')} ₽</p>
            <p className="text-zinc-400">{t.paymentsCountPeriod}: {data.monetization.payments_count_period}</p>
          </div>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-2 font-medium">{t.blockAiSearch}</h3>
          <p>{t.aiSearching}: {data.ai_search.searching}</p>
          <p>{t.aiReady}: {data.ai_search.ready}</p>
          <p>{t.aiFailed}: {data.ai_search.failed}</p>
        </Card>
        <Card>
          <h3 className="mb-2 font-medium">{t.blockSafety}</h3>
          <p>{t.bannedUsers}: {data.safety.banned_users}</p>
          {Object.entries(data.safety.reports_by_reason).map(([reason, count]) => (
            <p key={reason} className="text-sm text-zinc-400">{labelReportReason(reason)}: {count}</p>
          ))}
        </Card>
      </div>
    </div>
  )
}
