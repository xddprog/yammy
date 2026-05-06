import type { LucideIcon } from 'lucide-react'
import { GalleryHorizontal, Heart, MessageCircleHeart, UserRound } from 'lucide-react'
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
    to: ERouteNames.CHATS_ROUTE,
    icon: MessageCircleHeart,
    label: 'Метчи',
  },
  {
    to: ERouteNames.LIKES_ROUTE,
    icon: Heart,
    label: 'Лайки',
  },
  {
    to: ERouteNames.DASHBOARD_ROUTE,
    icon: GalleryHorizontal,
    label: 'Главная',
  },
  {
    to: ERouteNames.PROFILE_ROUTE,
    icon: UserRound,
    label: 'Профиль',
  },
]

const navItemBaseClasses = cn(
  'group flex flex-1 flex-col items-center justify-center',
  'gap-1.5 py-3 px-4 min-w-0',
  'cursor-pointer select-none touch-manipulation',
  'transition-all duration-200 ease-out',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6BA4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'active:scale-95',
)

interface NavContentProps {
  icon: LucideIcon
  label: string
  isActive: boolean
}

const NavContent = ({ icon: Icon, isActive }: NavContentProps): JSX.Element => (
  <>
    <Icon
      size={ICON_SIZE}
      strokeWidth={STROKE_WIDTH}
      className={cn(
        'shrink-0 transition-all duration-200',
        isActive
          ? 'text-[#FF6BA4]'
          : 'text-white group-hover:text-foreground group-active:text-[#FF6BA4]/80',
      )}
      aria-hidden="true"
    />
  </>
)

const Navbar = (): JSX.Element => (
  <nav
    className="flex shrink-0 items-stretch justify-around mt-3"
    role="navigation"
    aria-label="Основная навигация"
  >
    {navItems.map(({ to, icon, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) => cn(navItemBaseClasses, isActive && 'pointer-events-none')}
      >
        {({ isActive }) => <NavContent icon={icon} label={label} isActive={isActive} />}
      </NavLink>
    ))}
  </nav>
)

export default Navbar
