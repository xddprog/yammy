import type { LucideIcon } from 'lucide-react'
import { GalleryHorizontal, Heart, MessageCircle, UserRound } from 'lucide-react'
import type { JSX } from 'react'
import { NavLink } from 'react-router-dom'

import { cn, ERouteNames } from '@/shared'

const ICON_SIZE = 24
const STROKE_WIDTH = 1.8

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
  routeExists: boolean
}

const navItems: NavItem[] = [
  {
    to: '/messages',
    icon: MessageCircle,
    label: 'Чаты',
    routeExists: false,
  },
  {
    to: '/likes',
    icon: Heart,
    label: 'Лайки',
    routeExists: false,
  },
  {
    to: ERouteNames.DASHBOARD_ROUTE,
    icon: GalleryHorizontal,
    label: 'Главная',
    routeExists: true,
  },
  {
    to: '/profile',
    icon: UserRound,
    label: 'Настройки',
    routeExists: false,
  },
]

const navItemBaseClasses = cn(
  'group flex flex-1 flex-col items-center justify-center',
  'gap-1 py-2.5 px-4',
  'cursor-pointer select-none',
  'transition-colors duration-150',
  'focus-visible:outline-none',
)

interface NavContentProps {
  icon: LucideIcon
  label: string
  isActive: boolean
}

const NavContent = ({ icon: Icon, label, isActive }: NavContentProps): JSX.Element => (
  <>
    <Icon
      size={ICON_SIZE}
      strokeWidth={STROKE_WIDTH}
      className={cn(
        'shrink-0 transition-colors duration-150',
        isActive ? 'text-[#FF6BA4]' : 'text-white',
      )}
      aria-hidden="true"
    />
    <span
      className={cn(
        'text-[10px] font-medium leading-tight',
        'transition-colors duration-150',
        isActive ? 'text-[#FF6BA4]' : 'text-white',
      )}
    >
      {label}
    </span>
  </>
)

const GlassNavbar = (): JSX.Element => (
  <nav
    className={cn(
      'bg-black/40 mt-3',
      'backdrop-blur-3xl',
      'flex shrink-0 items-stretch justify-around',
      'rounded-full',
      'px-1 py-1',
      'ring-1 ring-inset ring-white/10',
    )}
    role="navigation"
    aria-label="Основная навигация"
  >
    {navItems.map(({ to, icon, label, routeExists }) => {
      if (routeExists) {
        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(navItemBaseClasses, isActive && 'rounded-full bg-white/8')
            }
          >
            {({ isActive }) => <NavContent icon={icon} label={label} isActive={isActive} />}
          </NavLink>
        )
      }

      return (
        <button
          key={to}
          type="button"
          className={cn(navItemBaseClasses, 'hover:bg-white/5 rounded-full', 'active:scale-95')}
          aria-label={label}
        >
          <NavContent icon={icon} label={label} isActive={false} />
        </button>
      )
    })}
  </nav>
)

export default GlassNavbar
