import { Card, Button, Badge } from '@/shared/ui/primitives'
import { formatDate } from '@/shared/lib/utils'
import { updateReport } from '@/entities/admin-auth/api'
import type { AdminReportItem } from '@/shared/api/types'
import type { StaffSession } from '@/entities/admin-auth/api'
import { labelReportReason, labelReportStatus, t } from '@/shared/lib/labels'
import { ReportChatPanel } from '@/widgets/ReportChatPanel'

export function ReportsList({
  reports,
  reportedUserId,
  reportedUserName,
  onChanged,
}: {
  reports: AdminReportItem[]
  reportedUserId: string
  reportedUserName: string
  staff?: StaffSession
  onChanged: () => void
}) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold">{t.reportsList} ({reports.length})</h2>
      {reports.length === 0 ? (
        <p className="text-sm text-zinc-500">{t.noReports}</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={report.status === 'pending' ? 'danger' : 'neutral'}>
                  {labelReportStatus(report.status)}
                </Badge>
                <span className="text-sm font-medium">{labelReportReason(report.reason)}</span>
                <span className="text-xs text-zinc-500">{formatDate(report.created_at)}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{report.comment || '—'}</p>
              <p className="mt-1 text-xs text-zinc-500">{t.reportFrom} {report.reporter_name}</p>
              <ReportChatPanel
                reportedUserId={reportedUserId}
                reportedUserName={reportedUserName}
                reporterId={report.reporter_id}
                reporterName={report.reporter_name}
              />
              {report.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => void updateReport(report.id, 'reviewed').then(onChanged)}
                  >
                    {t.markReviewed}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void updateReport(report.id, 'dismissed').then(onChanged)}
                  >
                    {t.dismiss}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
