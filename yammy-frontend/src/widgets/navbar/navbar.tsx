import type { LucideIcon } from 'lucide-react'
import { Heart, MessageCircle, UserRound, Astroid } from 'lucide-react'

import type { JSX } from 'react'
import { NavLink } from 'react-router-dom'

import { cn, ERouteNames } from '@/shared'

const ICON_SIZE = 26
const STROKE_WIDTH = 1.6

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

const navItems: NavItem[] = [
  {
    to: ERouteNames.DASHBOARD_ROUTE,
    icon: Astroid,
    label: 'Главная',
  },
  {
    to: ERouteNames.PROFILE_ROUTE,
    icon: UserRound,
    label: 'Профиль',
  },
  {
    to: ERouteNames.CHATS_ROUTE,
    icon: MessageCircle,
    label: 'Метчи',
  },
  {
    to: ERouteNames.LIKES_ROUTE,
    icon: Heart,
    label: 'Лайки',
  },
]

const navItemBaseClasses = cn(
  'group flex flex-1 items-center justify-center',
  'min-w-0 p-0',
  'cursor-pointer select-none touch-manipulation',
  'transition-all duration-200 ease-out',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'active:scale-95',
)

interface NavContentProps {
  icon: LucideIcon
  isActive: boolean
}

const NavContent = ({ icon: Icon, isActive }: NavContentProps): JSX.Element => (
  <span
    className={cn(
      'flex shrink-0 items-center justify-center rounded-full transition-all duration-200',
      isActive ? 'h-[72px] w-[72px] bg-background text-accent' : 'h-14 w-14 text-background/80',
    )}
  >
    <Icon
      size={ICON_SIZE}
      strokeWidth={STROKE_WIDTH}
      className={cn(
        'shrink-0 transition-all duration-200',
        isActive ? 'text-accent' : 'text-background/80 group-hover:text-background group-active:text-primary',
      )}
      aria-hidden="true"
    />
  </span>
)

const Navbar = (): JSX.Element => (
  <nav
    className="mx-auto mb-2 mt-5 flex h-[84px] w-[82%] shrink-0 items-center justify-around rounded-full bg-secondary px-2"
    role="navigation"
    aria-label="Основная навигация"
  >
    {navItems.map(({ to, icon }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) => cn(navItemBaseClasses, isActive && 'pointer-events-none')}
      >
        {({ isActive }) => <NavContent icon={icon} isActive={isActive} />}
      </NavLink>
    ))}
  </nav>
)

export default Navbar
