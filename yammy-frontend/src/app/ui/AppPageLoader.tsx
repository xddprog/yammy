import type { JSX } from 'react'

import { cn } from '@/shared'

import { AppLogoLoader } from './AppLogoLoader'

type AppPageLoaderProps = {
  className?: string
  /** На весь экран (экран чата, сплэш-подобно). */
  fullscreen?: boolean
  size?: 'default' | 'compact' | 'small'
  /** solid — чёрный фон (чат); blur — полупрозрачный блюр поверх страницы. */
  backdrop?: 'solid' | 'blur'
}

export function AppPageLoader({
  className,
  fullscreen = false,
  size = 'default',
  backdrop = 'solid',
}: AppPageLoaderProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        backdrop === 'blur' ? 'bg-black/45 backdrop-blur-md' : 'bg-black',
        fullscreen ? 'fixed inset-0 z-50' : 'h-full w-full min-h-[inherit]',
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <AppLogoLoader size={size} />
    </div>
  )
}
