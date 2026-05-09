import { motion } from 'framer-motion'
import type { JSX } from 'react'

import { LOAD_PAGE_LOGO_PATH_D } from './loadPageLogoPath'

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
      <div className="yammy-app-splash-logo">
        <svg
          className="yammy-app-splash-logo-svg"
          viewBox="0 0 1497 1080"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            className="yammy-app-splash-logo-outline"
            d={LOAD_PAGE_LOGO_PATH_D}
            fill="none"
            pathLength={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={32}
            vectorEffect="nonScalingStroke"
          />
        </svg>
      </div>
    </motion.div>
  )
}
