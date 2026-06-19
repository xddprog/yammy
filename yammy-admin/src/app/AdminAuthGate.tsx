import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentStaff } from '@/entities/admin-auth/api'
import { AdminLayout } from '@/widgets/AdminLayout'
import { t } from '@/shared/lib/labels'

export function AdminAuthGate() {
  const location = useLocation()
  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: fetchCurrentStaff,
    retry: false,
  })

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-zinc-400">{t.loading}</div>
  }

  if (!staff) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <AdminLayout staff={staff} />
}

export function RoleGuard({ role }: { role: 'admin' }) {
  const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: fetchCurrentStaff })
  if (!staff) return null
  if (staff.role !== role) {
    return <Navigate to="/moderation/profiles" replace />
  }
  return <Outlet />
}
