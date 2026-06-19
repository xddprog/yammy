import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchCurrentStaff, fetchUserDetail, fetchUserReports } from '@/entities/admin-auth/api'
import { UserDetailView } from '@/widgets/UserDetailView'
import { t } from '@/shared/lib/labels'

export function UserDetailPage() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: fetchCurrentStaff })
  const { data: user, refetch } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => fetchUserDetail(userId),
    enabled: Boolean(userId),
  })
  const { data: reports = [], refetch: refetchReports } = useQuery({
    queryKey: ['user-reports', userId],
    queryFn: () => fetchUserReports(userId),
    enabled: Boolean(userId),
  })

  if (!user || !staff) return <div className="text-zinc-400">{t.loading}</div>

  return (
    <div className="space-y-4">
      <button type="button" className="text-sm text-zinc-400 hover:text-white" onClick={() => navigate(-1)}>
        {t.back}
      </button>
      <UserDetailView
        user={user}
        reports={reports}
        staff={staff}
        onChanged={() => {
          void refetch()
          void refetchReports()
        }}
      />
    </div>
  )
}
