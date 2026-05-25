import { motion } from 'framer-motion'
import type { JSX } from 'react'

import { AppLogoLoader } from './AppLogoLoader'

export function AppSplashScreen(): JSX.Element {
  return (
    <motion.div
      aria-busy="true"
      aria-live="polite"
      className="yammy-app-splash-screen fixed inset-0 z-[10000] flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <AppLogoLoader />
    </motion.div>
  )
}
