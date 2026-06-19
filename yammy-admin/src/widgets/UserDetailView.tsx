import { ReportsList } from '@/widgets/ReportsList'
import { UserActionsPanel } from '@/widgets/UserActionsPanel'
import { UserProfilePreview } from '@/widgets/UserProfilePreview'
import type { AdminReportItem, AdminUserDetail } from '@/shared/api/types'
import type { StaffSession } from '@/entities/admin-auth/api'

export function UserDetailView({
  user,
  reports,
  staff,
  onChanged,
}: {
  user: AdminUserDetail
  reports: AdminReportItem[]
  staff: StaffSession
  onChanged: () => void
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <UserProfilePreview user={user} />
        <ReportsList
          reports={reports}
          reportedUserId={user.id}
          reportedUserName={user.name}
          staff={staff}
          onChanged={onChanged}
        />
      </div>
      {staff.role === 'admin' && <UserActionsPanel user={user} onChanged={onChanged} />}
    </div>
  )
}
