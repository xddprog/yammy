import { motion } from 'framer-motion'
import type { JSX } from 'react'
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { PresenceProvider } from '@/entities/chat'
import { ERouteNames } from '@/shared/lib/routeVariables'
import { topHeaderScrimLayerClassNames, type TopHeaderScrimVariant } from '@/widgets'
import { Navbar } from '@/widgets/navbar'

const RootPage = (): JSX.Element => {
  const location = useLocation()
  const { pathname } = location
  const isChatDetail = pathname.includes('/chats/')
  const isAiSearch = pathname.includes('/ai-search')
  const hideNavbar = isChatDetail || isAiSearch
  const showEdgeGradients = !isChatDetail
  const topScrimVariant: TopHeaderScrimVariant = pathname.includes(
    `/${ERouteNames.DASHBOARD_ROUTE}`,
  )
    ? 'dark'
    : 'background'

  return (
    <PresenceProvider>
      <Suspense>
        <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden overscroll-none">
          <motion.main
            key={location.pathname}
            className="min-h-0 min-w-0 flex-1 overflow-x-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Outlet />
          </motion.main>
          {showEdgeGradients && (
            <div
              className={topHeaderScrimLayerClassNames({ variant: topScrimVariant })}
              aria-hidden
            />
          )}
          {showEdgeGradients && !isAiSearch && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          )}
          {!hideNavbar && (
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[110] flex justify-center px-4 [padding-bottom:calc(1.25rem+env(safe-area-inset-bottom,0px))]">
              <div className="pointer-events-auto relative w-full max-w-md">
                <Navbar className="relative z-[110] my-0" />
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </PresenceProvider>
  )
}

export default RootPage
