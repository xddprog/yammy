import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminAuthGate, RoleGuard } from '@/app/AdminAuthGate'
import { LoginPage } from '@/pages/login/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ProfilesModerationPage } from '@/pages/moderation/ProfilesModerationPage'
import { ProfileDetailPage } from '@/pages/moderation/ProfileDetailPage'
import { ReportedUsersPage } from '@/pages/moderation/ReportedUsersPage'
import { ReportedUserDetailPage } from '@/pages/moderation/ReportedUserDetailPage'
import { UsersSearchPage } from '@/pages/users/UsersSearchPage'
import { UserDetailPage } from '@/pages/users/UserDetailPage'
import { FiltersPage } from '@/pages/filters/FiltersPage'
import { SupportPage } from '@/pages/support/SupportPage'
import { SupportDetailPage } from '@/pages/support/SupportDetailPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AdminAuthGate />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route element={<RoleGuard role="admin" />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersSearchPage />} />
            <Route path="/users/:userId" element={<UserDetailPage />} />
            <Route path="/filters" element={<FiltersPage />} />
          </Route>
          <Route path="/moderation/profiles" element={<ProfilesModerationPage />} />
          <Route path="/moderation/profiles/:userId" element={<ProfileDetailPage />} />
          <Route path="/moderation/reported-users" element={<ReportedUsersPage />} />
          <Route path="/moderation/reported-users/:userId" element={<ReportedUserDetailPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/support/:conversationId" element={<SupportDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
