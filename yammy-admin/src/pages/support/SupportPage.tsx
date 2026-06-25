import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchSupportConversations } from '@/entities/admin-auth/api'
import { Badge, Card } from '@/shared/ui/primitives'
import { formatDate } from '@/shared/lib/utils'
import { labelSupportRequestType, labelSupportStatus, t } from '@/shared/lib/labels'

export function SupportPage() {
  const [statusFilter, setStatusFilter] = useState<'open' | undefined>('open')

  const { data, isLoading } = useQuery({
    queryKey: ['support-conversations', statusFilter],
    queryFn: () => fetchSupportConversations(1, 50, statusFilter),
    refetchInterval: 20_000,
  })

  if (isLoading) return <div className="text-zinc-400">{t.loading}</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.supportInbox}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${statusFilter === 'open' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
            onClick={() => setStatusFilter('open')}
          >
            {t.supportOpenOnly}
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${statusFilter === undefined ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
            onClick={() => setStatusFilter(undefined)}
          >
            {t.supportAll}
          </button>
        </div>
      </div>

      {!data?.items.length ? (
        <Card><p className="text-zinc-400">{t.supportNoTickets}</p></Card>
      ) : (
        <div className="space-y-2">
          {data.items.map((item) => (
            <Link key={item.id} to={`/support/${item.id}`}>
              <Card className="flex items-center gap-4 transition hover:border-zinc-600">
                {item.user?.main_photo ? (
                  <img src={item.user.main_photo} alt="" className="size-14 rounded-lg object-cover" />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-lg bg-zinc-800 text-xs text-zinc-500">
                    TG
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {item.user ? `${item.user.name}, ${item.user.age}` : `Telegram ${item.telegram_id}`}
                  </div>
                  <div className="truncate text-sm text-zinc-400">
                    {item.last_message_preview ?? '—'}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                    <span>{labelSupportRequestType(item.request_type)}</span>
                    <span>·</span>
                    <span>{formatDate(item.last_message_at ?? item.created_at)}</span>
                  </div>
                </div>
                <Badge tone={item.status === 'open' ? 'success' : 'neutral'}>
                  {labelSupportStatus(item.status)}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
