import { motion } from 'framer-motion'
import type { JSX } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

const AuthPage = (): JSX.Element => {
  const { pathname } = useLocation()

  return (
    <div>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <Outlet />
      </motion.div>
    </div>
  )
}

export default AuthPage
