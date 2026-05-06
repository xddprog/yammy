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

  return (
    <Suspense>
      <div
        className={cn(
          'relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden overscroll-none',
          isChatDetail ? 'p-0' : 'px-4 pt-10 pb-7',
        )}
      >
        {!isChatDetail && <Header />}
        <motion.main
          key={location.pathname}
          className="flex-1 min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <Outlet />
        </motion.main>
        {!isChatDetail && <Navbar />}
      </div>
    </Suspense>
  )
}

export default RootPage
