import { motion } from 'framer-motion'
import type { JSX } from 'react'
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { cn } from '@/shared'
import { Header } from '@/widgets'
import { Navbar } from '@/widgets/navbar'

const RootPage = (): JSX.Element => {
  const { pathname } = useLocation()
  const isChatDetail = pathname.includes('/chats/')
  const isChatsPage = pathname.endsWith('/chats')

  return (
    <Suspense>
      <div
        className={cn(
          'relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden overscroll-none bg-background',
          isChatDetail ? 'pt-7 pb-5' : isChatsPage ? 'px-5 pt-6 pb-5' : 'px-5 pt-7 pb-5',
        )}
      >
        {!isChatDetail && !isChatsPage && <Header />}
        <main className="flex-1 min-h-0">
          <motion.div
            key={pathname}
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
        {!isChatDetail && <Navbar />}
      </div>
    </Suspense>
  )
}

export default RootPage
