import { QueryClientProvider } from '@tanstack/react-query'
import type { JSX } from 'react'
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'

import { AppBootstrapShell } from '@/app/ui/AppBootstrapShell'
import { FiltersProvider } from '@/features/matches-filter/model/FiltersContext'
import { routes } from '@/pages/routes'
import { queryClient } from '@/shared/api/queryClient'
import { useViewerLanguage } from '@/shared/hooks/useViewerLanguage'
import { ErrorToastProvider } from '@/shared/ui/error-toast/ErrorToastProvider'
import { OverlayProvider } from '@/shared/ui/overlay/overlay'

import { ThemeProvider } from './themeProvider'

/** Держит в кеше `GET .../auth/current_user` и синхронизирует `<html lang>`. */
function CurrentUserSessionBootstrap(): null {
  const language = useViewerLanguage()

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return null
}

export const Providers = (): JSX.Element => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <CurrentUserSessionBootstrap />
      <AppBootstrapShell>
        <ErrorToastProvider>
          <FiltersProvider>
            <OverlayProvider>
              <RouterProvider router={routes} />
            </OverlayProvider>
          </FiltersProvider>
        </ErrorToastProvider>
      </AppBootstrapShell>
    </QueryClientProvider>
  </ThemeProvider>
)
