import type { JSX } from 'react'
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { cn } from '@/shared'
import { Header } from '@/widgets'
import { Navbar } from '@/widgets/navbar'

const RootPage = (): JSX.Element => {
  const { pathname } = useLocation()
  const isChatDetail = pathname.includes('/chats/')

  return (
    <Suspense>
      <div
        className={cn(
          'relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden overscroll-none bg-background',
          isChatDetail ? 'pt-6 pb-7' : 'px-5 pt-7 pb-7',
        )}
      >
        {!isChatDetail && <Header />}
        <main className="flex-1 min-h-0">
          <Outlet />
        </main>
        {!isChatDetail && <Navbar />}
      </div>
    </Suspense>
  )
}

export default RootPage
