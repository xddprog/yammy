import { AnimatePresence } from 'framer-motion'
import type { JSX } from 'react'
import type { ReactNode } from 'react'

import { useAppSplashVisible } from '@/app/hooks/useAppSplashVisible'

import { AppSplashScreen } from './AppSplashScreen'

type AppBootstrapShellProps = {
  children: ReactNode
}

export function AppBootstrapShell({ children }: AppBootstrapShellProps): JSX.Element {
  const showSplash = useAppSplashVisible()

  return (
    <>
      {children}
      <AnimatePresence>
        {showSplash ? <AppSplashScreen key="yammy-app-splash" /> : null}
      </AnimatePresence>
    </>
  )
}
