import type { JSX, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight, Copy, X } from 'lucide-react'
import { memo, useEffect, useRef, useState } from 'react'

import type { UserLanguage } from '@/entities/user/types/types'
import { Button, cn, showErrorToast, useOverlay } from '@/shared'
import { triggerHaptic } from '@/shared/lib/haptics'
import { bottomSheetChromeClassNames, bottomSheetPanelClassNames } from '@/widgets'

function SheetShell({
  title,
  close,
  children,
}: {
  title: string
  close: () => void
  children: ReactNode
}): JSX.Element {
  return (
    <div className={bottomSheetChromeClassNames}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-[200] text-foreground">{title}</h2>
        <button
          type="button"
          onClick={close}
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          aria-label="Закрыть"
        >
          <X className="size-5" strokeWidth={2} />
        </button>
      </div>
      {children}
    </div>
  )
}

const NOTIFICATION_LABELS: { label: string; value: boolean }[] = [
  { label: 'Вкл.', value: true },
  { label: 'Выкл.', value: false },
]

const LANGUAGE_OPTIONS: { label: string; value: UserLanguage }[] = [
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
]

export const ProfileNotificationsSheetRow = memo(function ProfileNotificationsSheetRow({
  enabled,
  onApply,
  disabled,
}: {
  enabled: boolean
  onApply: (next: boolean) => void
  disabled?: boolean
}): JSX.Element {
  const { open } = useOverlay()
  const summary = enabled ? 'Вкл.' : 'Выкл.'

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="Уведомления"
      onClick={() =>
        open({
          backdropClassName: 'bg-black/50 backdrop-blur-sm',
          panelClassName: bottomSheetPanelClassNames,
          content: (close) => (
            <SheetShell title="Уведомления" close={close}>
              <ul className="max-h-[min(60vh,280px)] overflow-y-auto rounded-2xl bg-card/80 py-1 no-scrollbar">
                {NOTIFICATION_LABELS.map((row) => {
                  const selected = row.value === enabled
                  return (
                    <li key={String(row.value)}>
                      <button
                        type="button"
                        className={cn(
                          'w-full cursor-pointer px-4 py-3 text-left text-[14px] font-[200] transition-colors hover:bg-background/60',
                          selected ? 'text-[#FF6BA4]' : 'text-foreground',
                        )}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onApply(row.value)
                          close()
                        }}
                      >
                        {row.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </SheetShell>
          ),
        })
      }
      className={cn(
        'flex w-full items-center gap-3 rounded-[28px] bg-card px-4 py-7.5 text-left transition-colors',
        'hover:bg-card/85 active:scale-[0.99]',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <span className="min-w-0 flex-1 text-[14px] font-[200] text-foreground">Уведомления</span>
      <span className="truncate text-[14px] font-[200] text-muted-foreground">{summary}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
    </button>
  )
})

export const ProfileLanguageSheetRow = memo(function ProfileLanguageSheetRow({
  language,
  onApply,
  disabled,
}: {
  language: UserLanguage
  onApply: (next: UserLanguage) => void
  disabled?: boolean
}): JSX.Element {
  const { open } = useOverlay()
  const summary = LANGUAGE_OPTIONS.find((o) => o.value === language)?.label ?? language

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="Язык"
      onClick={() =>
        open({
          backdropClassName: 'bg-black/50 backdrop-blur-sm',
          panelClassName: bottomSheetPanelClassNames,
          content: (close) => (
            <SheetShell title="Язык" close={close}>
              <ul className="max-h-[min(60vh,280px)] overflow-y-auto rounded-2xl bg-card/80 py-1 no-scrollbar">
                {LANGUAGE_OPTIONS.map((row) => {
                  const selected = row.value === language
                  return (
                    <li key={row.value}>
                      <button
                        type="button"
                        className={cn(
                          'w-full cursor-pointer px-4 py-3 text-left text-[14px] font-[200] transition-colors hover:bg-background/60',
                          selected ? 'text-[#FF6BA4]' : 'text-foreground',
                        )}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onApply(row.value)
                          close()
                        }}
                      >
                        {row.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </SheetShell>
          ),
        })
      }
      className={cn(
        'flex w-full items-center gap-3 rounded-[28px] bg-card px-4 py-7.5 text-left transition-colors',
        'hover:bg-card/85 active:scale-[0.99]',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <span className="min-w-0 flex-1 text-[14px] font-[200] text-foreground">Язык</span>
      <span className="truncate text-[14px] font-[200] text-muted-foreground">{summary}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
    </button>
  )
})

const ProfileSuperlikesSheetContent = memo(function ProfileSuperlikesSheetContent({
  superlikesCount,
  onBuySuperlikes,
  close,
}: {
  superlikesCount: number
  onBuySuperlikes: () => void
  close: () => void
}): JSX.Element {
  return (
    <SheetShell title="Суперлайки" close={close}>
      <p className="mb-3 text-[13px] font-[200] leading-snug text-muted-foreground">
        Суперлайк помогает выделиться в ленте и повышает шанс, что вас заметят быстрее.
      </p>
      <div className="pb-1">
        <div className="flex min-h-[48px] items-center rounded-[24px] bg-card/60 px-4 py-2 ring-1 ring-inset ring-border/30">
          <input
            disabled
            value={String(superlikesCount)}
            aria-label="Баланс суперлайков"
            className="w-full cursor-not-allowed border-none bg-transparent py-1 text-[13px] font-[100] text-foreground outline-none"
          />
        </div>
      </div>
      <Button
        type="button"
        size="default"
        onClick={onBuySuperlikes}
        className="mt-3 w-full rounded-full shadow-lg shadow-[#FF6BA4]/25"
      >
        Купить суперлайки
      </Button>
    </SheetShell>
  )
})

export const ProfileSuperlikesSheetRow = memo(function ProfileSuperlikesSheetRow({
  superlikesCount,
  onBuySuperlikes,
}: {
  superlikesCount: number
  onBuySuperlikes: () => void
}): JSX.Element {
  const { open } = useOverlay()
  const summary = String(superlikesCount)

  return (
    <button
      type="button"
      aria-label="Суперлайки"
      onClick={() =>
        open({
          backdropClassName: 'bg-black/50 backdrop-blur-sm',
          panelClassName: bottomSheetPanelClassNames,
          content: (close) => (
            <ProfileSuperlikesSheetContent
              superlikesCount={superlikesCount}
              onBuySuperlikes={onBuySuperlikes}
              close={close}
            />
          ),
        })
      }
      className="flex w-full items-center gap-3 rounded-[28px] bg-card px-4 py-7.5 text-left transition-colors hover:bg-card/85 active:scale-[0.99]"
    >
      <span className="min-w-0 flex-1 text-[14px] font-[200] text-foreground">Суперлайки</span>
      <span className="truncate text-[14px] font-[200] text-muted-foreground">{summary}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
    </button>
  )
})

const ProfileBoostsSheetContent = memo(function ProfileBoostsSheetContent({
  boostsCount,
  boostExpiresAt,
  onActivate,
  onBuyBoostsPackage,
  activating,
  close,
}: {
  boostsCount: number
  boostExpiresAt: string | null
  onActivate: () => void
  onBuyBoostsPackage: () => void
  activating?: boolean
  close: () => void
}): JSX.Element {
  const boostExpiresDate = boostExpiresAt ? new Date(boostExpiresAt) : null
  const isBoostActive = Boolean(boostExpiresDate && !Number.isNaN(boostExpiresDate.getTime()) && boostExpiresDate.getTime() > Date.now())
  const boostActiveUntil = isBoostActive && boostExpiresDate
    ? new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(boostExpiresDate)
    : null
  const edgeInsetClass = 'w-3 shrink-0 snap-start'
  const edgeInsetEndClass = 'w-3 shrink-0 snap-end'
  const peekItemClass = 'shrink-0 snap-start min-w-[calc(100%-3.5rem)]'

  return (
    <SheetShell title="Бусты" close={close}>
      <p className="mb-3 text-[13px] font-[200] leading-snug text-muted-foreground">
        Буст временно поднимает ваш профиль выше в рекомендациях, чтобы получить больше показов.
      </p>
      <div className="flex flex-col gap-2 pb-1">
        <div className="flex min-h-[48px] items-center rounded-[24px] bg-card/60 px-4 py-2 ring-1 ring-inset ring-border/30">
          <input
            disabled
            value={String(boostsCount)}
            aria-label="Баланс бустов"
            className="w-full cursor-not-allowed border-none bg-transparent py-1 text-[13px] font-[100] text-foreground outline-none"
          />
        </div>
        <div className="flex min-h-[48px] items-center rounded-[24px] bg-card/60 px-4 py-2 ring-1 ring-inset ring-border/30">
          <input
            disabled
            value={isBoostActive && boostActiveUntil ? `Активен до ${boostActiveUntil}` : 'Не активен'}
            aria-label="Статус активного буста"
            className="w-full cursor-not-allowed border-none bg-transparent py-1 text-[13px] font-[100] text-foreground outline-none"
          />
        </div>
      </div>

      <div className="-mx-5 mt-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        <div className="flex gap-2">
          <div className={edgeInsetClass} aria-hidden />
          <div className={peekItemClass}>
            <Button
              type="button"
              size="default"
              className="w-full rounded-full"
              disabled={activating || boostsCount <= 0 || isBoostActive}
              onClick={() => {
                onActivate()
                close()
              }}
            >
              {isBoostActive ? 'Буст уже активен' : 'Активировать буст'}
            </Button>
          </div>
          <div className={peekItemClass}>
            <Button
              type="button"
              variant="default"
              size="default"
              className="w-full rounded-full border-0 bg-white text-black hover:bg-white/90"
              onClick={onBuyBoostsPackage}
            >
              Купить бусты
            </Button>
          </div>
          <div className={edgeInsetEndClass} aria-hidden />
        </div>
      </div>
    </SheetShell>
  )
})

export const ProfileBoostsSheetRow = memo(function ProfileBoostsSheetRow({
  boostsCount,
  boostExpiresAt,
  onActivate,
  onBuyBoostsPackage,
  activating,
}: {
  boostsCount: number
  boostExpiresAt: string | null
  onActivate: () => void
  onBuyBoostsPackage: () => void
  activating?: boolean
}): JSX.Element {
  const { open } = useOverlay()
  const summary = String(boostsCount)

  return (
    <button
      type="button"
      aria-label="Бусты"
      onClick={() =>
        open({
          backdropClassName: 'bg-black/50 backdrop-blur-sm',
          panelClassName: bottomSheetPanelClassNames,
          content: (close) => (
            <ProfileBoostsSheetContent
              boostsCount={boostsCount}
              boostExpiresAt={boostExpiresAt}
              onActivate={onActivate}
              onBuyBoostsPackage={onBuyBoostsPackage}
              activating={activating}
              close={close}
            />
          ),
        })
      }
      className="flex w-full items-center gap-3 rounded-[28px] bg-card px-4 py-7.5 text-left transition-colors hover:bg-card/85 active:scale-[0.99]"
    >
      <span className="min-w-0 flex-1 text-[14px] font-[200] text-foreground">Бусты</span>
      <span className="truncate text-[14px] font-[200] text-muted-foreground">{summary}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
    </button>
  )
})

const ProfileReferralSheetContent = memo(function ProfileReferralSheetContent({
  referralCode,
  close,
}: {
  referralCode: string
  close: () => void
}): JSX.Element {
  const [copied, setCopied] = useState(false)
  const copiedHideTimeoutRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (copiedHideTimeoutRef.current != null) {
        window.clearTimeout(copiedHideTimeoutRef.current)
      }
    },
    [],
  )

  return (
    <SheetShell title="Пригласить друзей" close={close}>
      <p className="mb-3 text-[13px] font-[200] leading-snug text-muted-foreground">
        Отправьте ссылку другу. Когда он зарегистрируется по ней — вы получите +1 суперлайк и +1 буст.
      </p>
      <div className="flex flex-col gap-2 pb-1">
        <div className="flex items-end gap-2">
          <div className="flex min-h-[48px] flex-1 items-center rounded-[24px] bg-card px-4 py-2 ring-1 ring-inset ring-border/30">
            <input
              readOnly
              value={referralCode}
              placeholder="Ссылка пока недоступна"
              className="w-full border-none bg-transparent py-1 text-[13px] font-[100] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={!referralCode}
            onClick={async () => {
              if (!referralCode) return
              try {
                await navigator.clipboard.writeText(referralCode)
                triggerHaptic({ style: 'light' })
                if (copiedHideTimeoutRef.current != null) {
                  window.clearTimeout(copiedHideTimeoutRef.current)
                }
                setCopied(true)
                copiedHideTimeoutRef.current = window.setTimeout(() => {
                  setCopied(false)
                  copiedHideTimeoutRef.current = null
                }, 2000)
              } catch {
                showErrorToast('Не удалось скопировать')
              }
            }}
            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#FF6BA4] p-0 text-white shadow-lg shadow-[#FF6BA4]/20 transition-all hover:bg-[#FF6BA4]/90 active:scale-95 disabled:opacity-40"
            aria-label={copied ? 'Скопировано' : 'Скопировать ссылку'}
          >
            <span className="relative flex size-full items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="copied"
                    className="absolute flex size-full items-center justify-center"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.65, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 28 }}
                  >
                    <Check className="size-[22px]" strokeWidth={2.5} aria-hidden />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    className="absolute flex size-full items-center justify-center"
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    <Copy className="size-[20px]" strokeWidth={2} aria-hidden />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </Button>
        </div>
      </div>
    </SheetShell>
  )
})

export const ProfileReferralSheetRow = memo(function ProfileReferralSheetRow({
  referralsCount,
  referralCode,
}: {
  referralsCount: number
  referralCode: string
}): JSX.Element {
  const { open } = useOverlay()
  const summary = String(referralsCount)

  return (
    <button
      type="button"
      aria-label="Рефералы"
      onClick={() =>
        open({
          backdropClassName: 'bg-black/50 backdrop-blur-sm',
          panelClassName: bottomSheetPanelClassNames,
          content: (close) => <ProfileReferralSheetContent referralCode={referralCode} close={close} />,
        })
      }
      className="flex w-full items-center gap-3 rounded-[28px] bg-card px-4 py-7.5 text-left transition-colors hover:bg-card/85 active:scale-[0.99]"
    >
      <span className="min-w-0 flex-1 text-[14px] font-[200] text-foreground">Рефералы</span>
      <span className="truncate text-[14px] font-[200] text-muted-foreground">{summary}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
    </button>
  )
})

const ProfileAdequacySheetContent = memo(function ProfileAdequacySheetContent({
  adequacyScore,
  close,
}: {
  adequacyScore: number
  close: () => void
}): JSX.Element {
  const display = Number.isFinite(adequacyScore) ? adequacyScore.toFixed(1) : '—'

  return (
    <SheetShell title="Рейтинг адекватности" close={close}>
      <p className="mb-3 text-[13px] font-[200] leading-snug text-muted-foreground">
        Это оценка того, насколько ваш профиль выглядит безопасным и уместным для других: в неё входят жалобы,
        проверки модерации и общее качество контента. Высокий рейтинг поддерживает доверие в сообществе и показывает,
        что вы соблюдаете правила приложения.
      </p>
      <div className="pb-1">
        <div className="flex min-h-[48px] items-center rounded-[24px] bg-card/60 px-4 py-2 ring-1 ring-inset ring-border/30">
          <input
            disabled
            value={display}
            aria-label="Текущий рейтинг адекватности"
            className={cn(
              'w-full cursor-not-allowed border-none bg-transparent py-1 text-[13px] font-[100] outline-none',
              display === '—' ? 'text-muted-foreground' : 'text-foreground',
            )}
          />
        </div>
      </div>
    </SheetShell>
  )
})

export const ProfileAdequacySheetRow = memo(function ProfileAdequacySheetRow({
  adequacyScore,
}: {
  adequacyScore: number
}): JSX.Element {
  const { open } = useOverlay()
  const summary = Number.isFinite(adequacyScore) ? adequacyScore.toFixed(1) : '—'

  return (
    <button
      type="button"
      aria-label="Рейтинг адекватности"
      onClick={() =>
        open({
          backdropClassName: 'bg-black/50 backdrop-blur-sm',
          panelClassName: bottomSheetPanelClassNames,
          content: (close) => <ProfileAdequacySheetContent adequacyScore={adequacyScore} close={close} />,
        })
      }
      className="flex w-full items-center gap-3 rounded-[28px] bg-card px-4 py-7.5 text-left transition-colors hover:bg-card/85 active:scale-[0.99]"
    >
      <span className="min-w-0 flex-1 text-[14px] font-[200] text-foreground">Рейтинг адекватности</span>
      <span className="truncate text-[14px] font-[200] text-muted-foreground">{summary}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
    </button>
  )
})

export const ProfileStatInfoSheetContent = memo(function ProfileStatInfoSheetContent({
  title,
  value,
  description,
  close,
}: {
  title: string
  value: string
  description: string
  close: () => void
}): JSX.Element {
  return (
    <SheetShell title={title} close={close}>
      <p className="mb-3 text-[13px] font-[200] leading-snug text-muted-foreground">{description}</p>
      <div className="pb-1">
        <div className="flex min-h-[48px] items-center rounded-[24px] bg-card/60 px-4 py-2 ring-1 ring-inset ring-border/30">
          <input
            disabled
            value={value}
            aria-label={title}
            className={cn(
              'w-full cursor-not-allowed border-none bg-transparent py-1 text-[13px] font-[100] outline-none',
              value === '—' ? 'text-muted-foreground' : 'text-foreground',
            )}
          />
        </div>
      </div>
    </SheetShell>
  )
})
