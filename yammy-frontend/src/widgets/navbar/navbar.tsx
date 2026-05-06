import type { LucideIcon } from 'lucide-react'
import { GalleryHorizontal, Heart, MessageCircle, UserRound } from 'lucide-react'
import type { JSX } from 'react'
import { NavLink } from 'react-router-dom'

import { cn, ERouteNames } from '@/shared'

const ICON_SIZE = 26

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

const navItems: NavItem[] = [
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
  'group relative flex flex-1 items-center justify-center',
  'min-w-0 p-0',
  'cursor-pointer select-none touch-manipulation',
  'transition-transform duration-200 ease-out active:scale-[0.96]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6BA4]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
)

interface NavContentProps {
  icon: LucideIcon
  isActive: boolean
}

const NavContent = ({ icon: Icon, isActive }: NavContentProps): JSX.Element => (
  <span
    className={cn(
      'flex shrink-0 items-center justify-center rounded-full bg-transparent',
      'transition-all duration-300 ease-out group-active:scale-[0.97]',
      isActive ? 'h-[77px] w-[77px] bg-black text-[#FF6BA4] scale-100' : 'h-14 w-14 text-black/70 group-hover:text-black',
    )}
  >
    <Icon
      size={ICON_SIZE}
      className="shrink-0 transition-colors duration-200"
      aria-hidden="true"
    />
  </span>
)

const Navbar = (): JSX.Element => (
  <nav
    className={cn(
      'mx-auto mb-2 mt-5 flex h-[84px] w-[82%] shrink-0 items-center justify-around overflow-hidden rounded-full border border-black/10 bg-white px-2',
      'transition-all duration-300',
    )}
    role="navigation"
    aria-label="Основная навигация"
  >
    {navItems.map(({ to, icon, label }) => (
      <NavLink key={to} to={to} className={navItemBaseClasses} aria-label={label}>
        {({ isActive }) => <NavContent icon={icon} isActive={isActive} />}
      </NavLink>
    ))}
  </nav>
)

export default Navbar
