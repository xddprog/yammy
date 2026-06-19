import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchReportedUsers } from '@/entities/admin-auth/api'
import { Badge, Card, Input } from '@/shared/ui/primitives'
import { formatDate } from '@/shared/lib/utils'
import { t } from '@/shared/lib/labels'

export function ReportedUsersPage() {
  const [q, setQ] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['reported-users', q],
    queryFn: () => fetchReportedUsers(1, 20, true, q),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t.reportedUsers}</h1>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchByName} />
      {isLoading ? (
        <div className="text-zinc-400">{t.loading}</div>
      ) : !data?.items.length ? (
        <Card><p className="text-zinc-400">{t.noReportedUsers}</p></Card>
      ) : (
        <div className="space-y-2">
          {data.items.map((item) => (
            <Link key={item.user.id} to={`/moderation/reported-users/${item.user.id}`}>
              <Card className="flex items-center gap-4 transition hover:border-zinc-600">
                {item.user.main_photo ? (
                  <img src={item.user.main_photo} alt="" className="size-14 rounded-lg object-cover" />
                ) : (
                  <div className="size-14 rounded-lg bg-zinc-800" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.user.name}</div>
                  <div className="text-sm text-zinc-400">{item.user.city}</div>
                </div>
                <Badge tone="danger">{item.pending_reports_count} {t.pendingReports}</Badge>
                <div className="text-sm text-zinc-400">{item.total_reports_count} {t.totalReports}</div>
                <div className="text-xs text-zinc-500">{formatDate(item.last_report_at)}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
