import type { JSX } from 'react'

import { cn } from '@/shared'

import { AppLogoLoader } from './AppLogoLoader'

type AppPageLoaderProps = {
  className?: string
  /** На весь экран (экран чата, сплэш-подобно). */
  fullscreen?: boolean
  size?: 'default' | 'compact' | 'small'
}

export function AppPageLoader({
  className,
  fullscreen = false,
  size = 'default',
}: AppPageLoaderProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-black',
        fullscreen ? 'fixed inset-0 z-10' : 'h-full w-full min-h-[inherit]',
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <AppLogoLoader size={size} />
    </div>
  )
}
