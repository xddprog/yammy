import { cn } from '@/shared'

import { LOAD_PAGE_LOGO_PATH_D } from './loadPageLogoPath'

type AppLogoLoaderProps = {
  className?: string
  size?: 'default' | 'compact' | 'small'
}

const sizeClassNames = {
  default: 'size-[120px]',
  compact: 'size-16',
  small: 'size-10',
} as const

export function AppLogoLoader({ className, size = 'default' }: AppLogoLoaderProps) {
  const dimension = sizeClassNames[size]

  return (
    <div className={cn('flex items-center justify-center', className)} aria-hidden>
      <svg className={cn('block', dimension)} viewBox="0 0 1497 1080" xmlns="http://www.w3.org/2000/svg">
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
  )
}
