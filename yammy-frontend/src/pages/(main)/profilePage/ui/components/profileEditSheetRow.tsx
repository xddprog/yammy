import type { JSX, ReactNode } from 'react'
import { ChevronRight, Forward, X } from 'lucide-react'
import { memo, useEffect, useRef, useState } from 'react'

import { Button, cn, showErrorToast, useOverlay } from '@/shared'
import { useCityNames } from '@/shared/hooks/useCityNames'
import { useUniversityNames } from '@/shared/hooks/useUniversityNames'
import { bottomSheetChromeClassNames, bottomSheetPanelClassNames } from '@/widgets'

import { PROFILE_BIO_MAX_LENGTH } from './profile.constants'

type SheetBase = {
  label: string
  placeholder?: string
  ariaLabel: string
}

export type ProfileEditSheetRowProps = SheetBase &
  (
    | {
        mode: 'age'
        value: string
        onApplyAge: (age: number) => void
      }
    | {
        mode: 'city'
        value: string
        onApply: (value: string) => void
      }
    | {
        mode: 'university'
        value: string
        suggestEnabled: boolean
        onApply: (value: string) => void
      }
    | {
        mode: 'pick'
        displayValue: string
        options: readonly string[]
        onPick: (optionLabel: string) => void
      }
    | {
        mode: 'text'
        value: string
        onApply: (value: string) => void
        textPlaceholder?: string
        maxLength?: number
      }
    | {
        mode: 'longtext'
        value: string
        onApply: (value: string) => void
        textPlaceholder?: string
        maxLength?: number
      }
  )

function SheetChrome({
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

const DEFAULT_JOB_MAX_LEN = 200

function FreeTextPanel({
  initialValue,
  onApply,
  close,
  label,
  textPlaceholder = 'Введите текст…',
  maxLength = DEFAULT_JOB_MAX_LEN,
}: {
  initialValue: string
  onApply: (value: string) => void
  close: () => void
  label: string
  textPlaceholder?: string
  maxLength?: number
}): JSX.Element {
  const [text, setText] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [])

  const apply = (): void => {
    const t = text.trim().slice(0, maxLength)
    onApply(t)
    close()
  }

  return (
    <SheetChrome title={label} close={close}>
      <div className="flex flex-col gap-2 pb-1">
        <div className="flex items-end gap-2">
          <div className="flex min-h-[48px] flex-1 items-center rounded-[24px] bg-card px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-[#FF6BA4]/50">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, maxLength))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  apply()
                }
              }}
              type="text"
              autoComplete="off"
              placeholder={textPlaceholder}
              maxLength={maxLength}
              className="w-full border-none bg-transparent py-1 text-[15px] font-[100] text-foreground outline-none placeholder:font-[100] placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={apply}
            className="h-12 w-12 shrink-0 rounded-full bg-[#FF6BA4] p-0 text-white shadow-lg shadow-[#FF6BA4]/20 transition-all hover:bg-[#FF6BA4]/90 active:scale-95"
            aria-label="Сохранить"
          >
            <Forward className="size-[22px]" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </SheetChrome>
  )
}

function LongTextPanel({
  initialValue,
  onApply,
  close,
  label,
  textPlaceholder = 'Расскажите о себе…',
  maxLength = PROFILE_BIO_MAX_LENGTH,
}: {
  initialValue: string
  onApply: (value: string) => void
  close: () => void
  label: string
  textPlaceholder?: string
  maxLength?: number
}): JSX.Element {
  const [text, setText] = useState(initialValue)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => areaRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [])

  const apply = (): void => {
    onApply(text.slice(0, maxLength).trim())
    close()
  }

  return (
    <SheetChrome title={label} close={close}>
      <div className="flex flex-col gap-3 pb-1">
        <textarea
          ref={areaRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxLength))}
          placeholder={textPlaceholder}
          maxLength={maxLength}
          rows={6}
          className="min-h-[140px] w-full resize-y rounded-[24px] border-none bg-card px-4 py-3 text-[15px] font-[100] text-foreground outline-none ring-0 transition-all focus:ring-2 focus:ring-[#FF6BA4]/50 placeholder:font-[100] placeholder:text-muted-foreground"
        />
        <Button
          type="button"
          size="default"
          variant="ghost"
          onClick={apply}
          className="h-12 shrink-0 rounded-full bg-[#FF6BA4] px-6 text-white shadow-lg shadow-[#FF6BA4]/20 transition-all hover:bg-[#FF6BA4]/90 active:scale-[0.99]"
        >
          Сохранить
        </Button>
      </div>
    </SheetChrome>
  )
}

function AgePanel({
  initialValue,
  onApplyAge,
  close,
  label,
}: {
  initialValue: string
  onApplyAge: (age: number) => void
  close: () => void
  label: string
}): JSX.Element {
  const [text, setText] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [])

  const apply = (): void => {
    const raw = text.trim().replace(/\s+/g, '')
    if (raw === '') {
      showErrorToast('Укажите возраст')
      return
    }
    const n = Number(raw)
    if (!Number.isFinite(n)) {
      showErrorToast('Введите корректный возраст')
      return
    }
    if (n < 16) {
      showErrorToast('Минимальный возраст — 16 лет')
      return
    }
    if (n > 100) {
      showErrorToast('Максимальный возраст — 100 лет')
      return
    }
    onApplyAge(n)
    close()
  }

  return (
    <SheetChrome title={label} close={close}>
      <div className="flex flex-col gap-2 pb-1">
        <div className="flex items-end gap-2">
          <div className="flex min-h-[48px] flex-1 items-center rounded-[24px] bg-card px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-[#FF6BA4]/50">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value.replace(/[^\d]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  apply()
                }
              }}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Например, 25"
              className="w-full border-none bg-transparent py-1 text-[15px] font-[100] text-foreground outline-none placeholder:font-[100] placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={apply}
            className="h-12 w-12 shrink-0 rounded-full bg-[#FF6BA4] p-0 text-white shadow-lg shadow-[#FF6BA4]/20 transition-all hover:bg-[#FF6BA4]/90 active:scale-95"
            aria-label="Сохранить"
          >
            <Forward className="size-[22px]" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </SheetChrome>
  )
}

type SuggestKind = 'city' | 'university'

function SuggestPanel({
  kind,
  label,
  initialValue,
  suggestEnabled,
  onApply,
  close,
}: {
  kind: SuggestKind
  label: string
  initialValue: string
  suggestEnabled: boolean
  onApply: (value: string) => void
  close: () => void
}): JSX.Element {
  const [text, setText] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [])

  const cityQuery = useCityNames(text, { enabled: kind === 'city' })
  const uniQuery = useUniversityNames(text, { enabled: kind === 'university' && suggestEnabled })
  const options = kind === 'city' ? (cityQuery.data ?? []) : (uniQuery.data ?? [])

  const apply = (): void => {
    onApply(text.trim())
    close()
  }

  const pickOption = (item: string): void => {
    onApply(item.trim())
    close()
  }

  return (
    <SheetChrome title={label} close={close}>
      {options.length > 0 ? (
        <ul className="mb-3 max-h-44 overflow-y-auto rounded-2xl bg-card/80 py-1 no-scrollbar">
          {options.map((item) => {
            const selected = item === text.trim()
            return (
              <li key={item}>
                <button
                  type="button"
                  className={cn(
                    'w-full cursor-pointer px-4 py-2.5 text-left text-[14px] font-[200] transition-colors hover:bg-background/60 active:bg-background/40',
                    selected ? 'text-[#FF6BA4]' : 'text-foreground',
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pickOption(item)}
                >
                  {item}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      <div className="flex flex-col gap-2 pb-1">
        <div className="flex items-end gap-2">
          <div className="flex min-h-[48px] flex-1 items-center rounded-[24px] bg-card px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-[#FF6BA4]/50">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  apply()
                }
              }}
              placeholder="Начните вводить…"
              autoComplete="off"
              className="w-full border-none bg-transparent py-1 text-[15px] font-[100] text-foreground outline-none placeholder:font-[100] placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={apply}
            className="h-12 w-12 shrink-0 rounded-full bg-[#FF6BA4] p-0 text-white shadow-lg shadow-[#FF6BA4]/20 transition-all hover:bg-[#FF6BA4]/90 active:scale-95"
            aria-label="Сохранить"
          >
            <Forward className="size-[22px]" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </SheetChrome>
  )
}

function PickPanel({
  label,
  options,
  selectedLabel,
  onPick,
  close,
}: {
  label: string
  options: readonly string[]
  /** Текущее значение (подсветка розовым, как в настройках). */
  selectedLabel: string
  onPick: (optionLabel: string) => void
  close: () => void
}): JSX.Element {
  return (
    <SheetChrome title={label} close={close}>
      <ul className="max-h-[min(60vh,320px)] overflow-y-auto rounded-2xl bg-card/80 py-1 no-scrollbar">
        {options.map((item) => {
          const selected = item === selectedLabel.trim()
          return (
            <li key={item}>
              <button
                type="button"
                className={cn(
                  'w-full cursor-pointer px-4 py-3 text-left text-[14px] font-[200] transition-colors hover:bg-background/60',
                  selected ? 'text-[#FF6BA4]' : 'text-foreground',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onPick(item)
                  close()
                }}
              >
                {item}
              </button>
            </li>
          )
        })}
      </ul>
    </SheetChrome>
  )
}

function ProfileEditSheetRowComponent(props: ProfileEditSheetRowProps): JSX.Element {
  const { open } = useOverlay()
  const placeholder = props.placeholder ?? 'Не указано'

  let summary: string
  if (props.mode === 'pick') {
    summary = props.displayValue.trim() === '' ? placeholder : props.displayValue
  } else {
    const raw = props.value
    if (raw.trim() === '') {
      summary = placeholder
    } else {
      summary = props.mode === 'longtext' ? raw.replace(/\n/g, ' ').replace(/\s+/g, ' ') : raw
    }
  }

  const openSheet = (): void => {
    open({
      backdropClassName: 'bg-black/50 backdrop-blur-sm',
      panelClassName: bottomSheetPanelClassNames,
      content: (close) => {
        switch (props.mode) {
          case 'age':
            return (
              <AgePanel
                label={props.label}
                initialValue={props.value}
                onApplyAge={props.onApplyAge}
                close={close}
              />
            )
          case 'city':
            return (
              <SuggestPanel
                kind="city"
                label={props.label}
                initialValue={props.value}
                suggestEnabled
                onApply={props.onApply}
                close={close}
              />
            )
          case 'university':
            return (
              <SuggestPanel
                kind="university"
                label={props.label}
                initialValue={props.value}
                suggestEnabled={props.suggestEnabled}
                onApply={props.onApply}
                close={close}
              />
            )
          case 'pick':
            return (
              <PickPanel
                label={props.label}
                options={props.options}
                selectedLabel={props.displayValue}
                onPick={props.onPick}
                close={close}
              />
            )
          case 'text':
            return (
              <FreeTextPanel
                label={props.label}
                initialValue={props.value}
                onApply={props.onApply}
                close={close}
                textPlaceholder={props.textPlaceholder}
                maxLength={props.maxLength}
              />
            )
          case 'longtext':
            return (
              <LongTextPanel
                label={props.label}
                initialValue={props.value}
                onApply={props.onApply}
                close={close}
                textPlaceholder={props.textPlaceholder}
                maxLength={props.maxLength}
              />
            )
        }
      },
    })
  }

  return (
    <button
      type="button"
      aria-label={props.ariaLabel}
      onClick={openSheet}
      className={cn(
        'flex w-full items-center justify-between rounded-[28px] bg-card px-4 py-7 text-left transition-colors',
        'hover:bg-card/90 active:scale-[0.99]',
      )}
    >
      <span className="text-[14px] font-[200] text-foreground">{props.label}</span>
      <div className="flex min-w-0 max-w-[60%] items-center gap-2">
        <span className="truncate text-[14px] font-[200] text-muted-foreground">{summary}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
      </div>
    </button>
  )
}

export const ProfileEditSheetRow = memo(ProfileEditSheetRowComponent)
