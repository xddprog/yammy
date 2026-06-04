import { ChevronLeft } from 'lucide-react'
import type { JSX, ReactNode } from 'react'

import { Button, cn } from '@/shared'
import { triggerHaptic } from '@/shared/lib/haptics'
import {
  appScreenBottomInsetClassNames,
  appScreenShellClassNames,
  appScreenTopInsetClassNames,
} from '@/widgets'

type OnboardingLayoutProps = {
  title: string
  step: number
  totalSteps: number
  children: ReactNode
  primaryLabel: string
  primaryDisabled?: boolean
  primaryLoading?: boolean
  onPrimary: () => void
  onBack?: () => void
  footerNote?: string
}

export function OnboardingLayout({
  title,
  step,
  totalSteps,
  children,
  primaryLabel,
  primaryDisabled,
  primaryLoading,
  onPrimary,
  onBack,
  footerNote,
}: OnboardingLayoutProps): JSX.Element {
  return (
    <div
      className={cn(
        appScreenShellClassNames,
        appScreenTopInsetClassNames,
      )}
    >
      <div className="mb-4 grid min-h-11 grid-cols-[2.75rem_1fr_2.75rem] items-center">
        <div className="flex justify-start">
          {onBack ? (
            <button
              type="button"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-card/85 active:scale-95"
              aria-label="Назад"
              onClick={() => {
                triggerHaptic({ style: 'light' })
                onBack()
              }}
            >
              <ChevronLeft className="size-5" strokeWidth={2} />
            </button>
          ) : (
            <span className="size-11 shrink-0" aria-hidden />
          )}
        </div>
        <p className="text-center text-xs font-light text-muted-foreground tabular-nums">
          Шаг {step} из {totalSteps}
        </p>
        <span className="size-11 shrink-0" aria-hidden />
      </div>
      <h1 className="mb-4 text-[22px] font-bold uppercase text-white">{title}</h1>
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">{children}</div>
      <div className={cn('shrink-0 pt-4', appScreenBottomInsetClassNames)}>
        {footerNote ? (
          <p className="mb-3 text-center text-xs font-light text-muted-foreground">{footerNote}</p>
        ) : null}
        <Button
          type="button"
          className="w-full rounded-full"
          disabled={primaryDisabled || primaryLoading}
          isLoader={primaryLoading}
          onClick={() => {
            triggerHaptic({ style: 'medium' })
            onPrimary()
          }}
        >
          {primaryLoading ? 'Сохранение…' : primaryLabel}
        </Button>
      </div>
    </div>
  )
}
