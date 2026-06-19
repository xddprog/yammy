import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Shield, Users, Flag, LogOut } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { logoutAdmin } from '@/entities/admin-auth/api'
import type { StaffSession } from '@/entities/admin-auth/api'
import { labelRole, t } from '@/shared/lib/labels'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
    isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white',
  )

export function AdminLayout({ staff }: { staff: StaffSession }) {
  const navigate = useNavigate()
  const isAdmin = staff.role === 'admin'

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-8 px-2">
          <div className="text-lg font-semibold">{t.appTitle}</div>
          <div className="text-xs text-zinc-500">{staff.username} · {labelRole(staff.role)}</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {isAdmin && (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                <LayoutDashboard className="size-4" /> {t.dashboard}
              </NavLink>
              <NavLink to="/users" className={linkClass}>
                <Users className="size-4" /> {t.users}
              </NavLink>
            </>
          )}
          <NavLink to="/moderation/profiles" className={linkClass}>
            <Shield className="size-4" /> {t.profiles}
          </NavLink>
          <NavLink to="/moderation/reported-users" className={linkClass}>
            <Flag className="size-4" /> {t.reports}
          </NavLink>
        </nav>
        <button
          type="button"
          className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
          onClick={() => {
            logoutAdmin()
            navigate('/login')
          }}
        >
          <LogOut className="size-4" /> {t.logout}
        </button>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
