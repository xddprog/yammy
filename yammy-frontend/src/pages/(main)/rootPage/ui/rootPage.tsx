import { motion } from 'framer-motion'
import type { JSX } from 'react'
import { Suspense, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { PresenceProvider } from '@/entities/chat'
import { ERouteNames } from '@/shared/lib/routeVariables'
import { topHeaderScrimLayerClassNames, type TopHeaderScrimVariant } from '@/widgets'
import { Navbar } from '@/widgets/navbar'

const pageTransition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 28,
  mass: 0.9,
}
const pageSlidePx = 14

function resolveMainTabKey(pathname: string): string {
  if (pathname.includes(`/${ERouteNames.CHATS_ROUTE}`)) return 'chats'
  if (pathname.includes(`/${ERouteNames.LIKES_ROUTE}`)) return 'likes'
  if (pathname.includes(`/${ERouteNames.DASHBOARD_ROUTE}`)) return 'dashboard'
  if (pathname.includes(`/${ERouteNames.PROFILE_ROUTE}`)) return 'profile'
  if (pathname.includes(`/${ERouteNames.AI_SEARCH_ROUTE}`)) return 'ai-search'
  return 'other'
}

function resolveMainTabIndex(tabKey: string): number {
  switch (tabKey) {
    case 'chats':
      return 0
    case 'likes':
      return 1
    case 'dashboard':
      return 2
    case 'profile':
      return 3
    default:
      return 2
  }
}

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

  const tabKey = resolveMainTabKey(pathname)
  const skipEnterAnimationRef = useRef(true)
  const prevTabIndexRef = useRef(resolveMainTabIndex(tabKey))
  const directionRef = useRef(1)

  const tabIndex = resolveMainTabIndex(tabKey)
  if (prevTabIndexRef.current !== tabIndex) {
    directionRef.current = tabIndex >= prevTabIndexRef.current ? 1 : -1
    skipEnterAnimationRef.current = false
  }

  useLayoutEffect(() => {
    prevTabIndexRef.current = tabIndex
  }, [tabIndex])

  const slideOffset = directionRef.current * pageSlidePx

  return (
    <PresenceProvider>
      <Suspense fallback={null}>
        <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden overscroll-none">
          <main className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden">
            <motion.div
              key={tabKey}
              className="h-full min-h-0"
              initial={
                skipEnterAnimationRef.current
                  ? false
                  : { opacity: 0.97, x: slideOffset }
              }
              animate={{ opacity: 1, x: 0 }}
              transition={pageTransition}
            >
              <Outlet />
            </motion.div>
          </main>
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
