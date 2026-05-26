import { motion } from 'framer-motion'
import type { JSX } from 'react'
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { PresenceProvider } from '@/entities/chat'
import { Navbar } from '@/widgets/navbar'

const RootPage = (): JSX.Element => {
  const location = useLocation()
  const { pathname } = location
  const isChatDetail = pathname.includes('/chats/')

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
          {!isChatDetail && (
            <div className="pointer-events-none fixed -top-1 left-1/2 z-30 h-24 w-full max-w-md -translate-x-1/2 bg-gradient-to-b from-black/55 via-black/25 to-transparent" />
          )}
          {!isChatDetail && (
            <div className="pointer-events-none fixed -bottom-2 left-1/2 z-30 h-24 w-full max-w-md -translate-x-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          )}
          {!isChatDetail && (
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[110] flex justify-center px-4 [padding-bottom:calc(2.25rem+env(safe-area-inset-bottom,0px))]">
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
