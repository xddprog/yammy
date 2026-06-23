import type { JSX } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getAccessToken } from '@/entities/token/lib/tokenService'
import { isOnboardingSession } from '@/entities/token/lib/isOnboardingSession'
import { useUserProfile } from '@/entities/user/hooks/useUserProfile'
import { AppPageLoader } from '@/app/ui/AppPageLoader'
import { ERouteNames } from '@/shared/lib/routeVariables'

function TelegramRequiredScreen(): JSX.Element {
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold text-white">Откройте Yammy в Telegram</h1>
      <p className="text-sm font-light text-muted-foreground">
        Приложение работает как Mini App внутри бота. Запустите его из Telegram.
      </p>
    </div>
  )
}

function BannedScreen(): JSX.Element {
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold text-white">Аккаунт заблокирован</h1>
      <p className="text-sm font-light text-muted-foreground">
        Если это ошибка, напишите в поддержку.
      </p>
    </div>
  )
}

function ProfileLoadErrorScreen({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold text-white">Не удалось загрузить профиль</h1>
      <p className="text-sm font-light text-muted-foreground">
        Проверьте интернет и попробуйте снова. Если только что завершили регистрацию — подождите
        немного и обновите.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black"
      >
        Повторить
      </button>
    </div>
  )
}

export function AppAuthGate(): JSX.Element {
  const location = useLocation()
  const hasToken = Boolean(getAccessToken())
  const onboardingSession = isOnboardingSession()
  const isOnboardingRoute = location.pathname.includes(ERouteNames.ONBOARDING_ROUTE)

  const { data: profile, isLoading, isError, refetch } = useUserProfile({
    enabled: hasToken && !onboardingSession,
    retry: 1,
  })

  if (!hasToken) {
    if (import.meta.env.DEV) {
      return <Outlet />
    }
    return <TelegramRequiredScreen />
  }

  if (onboardingSession) {
    if (!isOnboardingRoute) {
      return <Navigate to={`/${ERouteNames.ONBOARDING_ROUTE}`} replace />
    }
    return <Outlet />
  }

  if (isOnboardingRoute) {
    return <Navigate to={`/${ERouteNames.DASHBOARD_ROUTE}`} replace />
  }

  if (isLoading) {
    return <AppPageLoader />
  }

  if (isError || !profile) {
    if (import.meta.env.DEV) {
      return <Outlet />
    }
    return <ProfileLoadErrorScreen onRetry={() => void refetch()} />
  }

  if (profile.is_banned) {
    return <BannedScreen />
  }

  return <Outlet />
}
