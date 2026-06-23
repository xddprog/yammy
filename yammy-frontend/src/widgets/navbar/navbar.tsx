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
  'transition-transform duration-200 ease-out active:scale-[0.92]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6BA4]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
)

interface NavContentProps {
  icon: LucideIcon
  isActive: boolean
}

const NavContent = ({ icon: Icon, isActive }: NavContentProps): JSX.Element => (
  <span className="relative flex h-[77px] w-[77px] shrink-0 items-center justify-center">
    <span
      aria-hidden
      className={cn(
        'absolute rounded-full bg-black',
        'transition-[width,height,opacity] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
        isActive ? 'h-[77px] w-[77px] opacity-100' : 'h-14 w-14 opacity-0',
      )}
    />
    <Icon
      size={ICON_SIZE}
      className={cn(
        'relative z-10 shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
        isActive ? 'text-[#FF6BA4]' : 'text-black/70 group-hover:text-black',
      )}
      aria-hidden="true"
    />
  </span>
)

interface NavbarProps {
  className?: string
}

const Navbar = ({ className }: NavbarProps): JSX.Element => (
  <nav
    className={cn(
      'mx-auto mb-2 mt-5 flex h-[84px] w-[82%] shrink-0 items-center justify-around overflow-hidden rounded-full border border-black/10 bg-white px-2',
      'transition-all duration-300',
      className,
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
