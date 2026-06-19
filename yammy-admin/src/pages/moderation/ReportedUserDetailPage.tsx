import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { banUser, fetchCurrentStaff, fetchReportedUserDetail, resolveAllReports } from '@/entities/admin-auth/api'
import { Button } from '@/shared/ui/primitives'
import { UserDetailView } from '@/widgets/UserDetailView'
import { t } from '@/shared/lib/labels'

export function ReportedUserDetailPage() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: fetchCurrentStaff })
  const { data, refetch, isLoading } = useQuery({
    queryKey: ['reported-user', userId],
    queryFn: () => fetchReportedUserDetail(userId),
    enabled: Boolean(userId),
  })

  if (isLoading || !data || !staff) return <div className="text-zinc-400">{t.loading}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" className="text-sm text-zinc-400 hover:text-white" onClick={() => navigate(-1)}>
          {t.back}
        </button>
        {staff.role === 'admin' && (
          <>
            <Button variant="danger" onClick={() => void banUser(userId, true).then(() => refetch())}>
              {t.banUser}
            </Button>
            <Button variant="ghost" onClick={() => void resolveAllReports(userId).then(() => refetch())}>
              {t.resolveAllPending}
            </Button>
          </>
        )}
      </div>
      <UserDetailView user={data.user} reports={data.reports} staff={staff} onChanged={() => void refetch()} />
    </div>
  )
}
