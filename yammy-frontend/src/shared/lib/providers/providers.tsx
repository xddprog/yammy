import { QueryClientProvider } from '@tanstack/react-query'
import type { JSX } from 'react'
import { RouterProvider } from 'react-router-dom'

import { FiltersProvider } from '@/features/matches-filter/model/FiltersContext'
import { routes } from '@/pages/routes'
import { OverlayProvider, queryClient } from '@/shared'

import { ThemeProvider } from './themeProvider'

export const Providers = (): JSX.Element => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <FiltersProvider>
        <OverlayProvider>
          <RouterProvider router={routes} />
        </OverlayProvider>
      </FiltersProvider>
    </QueryClientProvider>
  </ThemeProvider>
)
