import { motion } from 'framer-motion'
import type { JSX } from 'react'
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { cn } from '@/shared'
import { Header } from '@/widgets'
import { Navbar } from '@/widgets/navbar'

const RootPage = (): JSX.Element => {
  const location = useLocation()
  const { pathname } = location
  const isChatDetail = pathname.includes('/chats/')
  const isDashboardPage = pathname === '/dashboard'
  const isLikesPage = pathname.startsWith('/likes')

  return (
    <Suspense>
      <div
        className={cn(
          'relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden overscroll-none pt-[95px]',
          isChatDetail ? '' : isDashboardPage ? 'px-4 pb-7' : isLikesPage ? 'px-4' : 'px-4',
        )}
      >
        {isDashboardPage && <Header />}
        <motion.main
          key={location.pathname}
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <Outlet />
        </motion.main>
        {!isChatDetail && (
          <div className="pointer-events-none fixed -bottom-2 left-1/2 z-30 h-24 w-full max-w-md -translate-x-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        )}
        {!isChatDetail && isDashboardPage && (
          <div className="relative z-40">
            <Navbar className="relative z-40" />
          </div>
        )}
        {!isChatDetail && !isDashboardPage && (
          <div className="pointer-events-none absolute inset-x-0 bottom-9 z-40 flex justify-center px-4">
            <div className="pointer-events-auto relative w-full">
              <Navbar className="relative z-40 my-0" />
            </div>
          </div>
        )}
      </div>
    </Suspense>
  )
}

export default RootPage
