import type { JSX } from 'react'
import { Outlet } from 'react-router-dom'

const AuthPage = (): JSX.Element => (
  <div>
    <Outlet />
  </div>
)

export default AuthPage
