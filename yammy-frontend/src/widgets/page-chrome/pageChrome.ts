import { cn } from '@/shared'

const topHeaderScrimDark =
  '[background-image:linear-gradient(to_bottom,rgb(0_0_0/0.98)_0%,rgb(0_0_0/0.94)_12%,rgb(0_0_0/0.88)_24%,rgb(0_0_0/0.76)_42%,rgb(0_0_0/0.56)_68%,rgb(0_0_0/0.32)_88%,rgb(0_0_0/0)_100%)]'

const topHeaderScrimOnBackground =
  '[background-image:linear-gradient(to_bottom,rgb(0_0_0/0.96)_0%,rgb(0_0_0/0.90)_12%,rgb(0_0_0/0.82)_26%,rgb(0_0_0/0.68)_45%,rgb(0_0_0/0.48)_70%,rgb(0_0_0/0.26)_90%,rgb(0_0_0/0)_100%)]'

export type TopHeaderScrimVariant = 'dark' | 'background'

/** Только затемнение (градиент), без sticky — для лайков, профиля и т.п. */
export const topHeaderScrimClassNames = ({
  variant = 'dark',
}: { variant?: TopHeaderScrimVariant } = {}): string =>
  variant === 'dark' ? topHeaderScrimDark : topHeaderScrimOnBackground

/** Sticky-шапка чатов: позиционирование + тот же scrim */
export const stickyTopHeaderClassNames = ({
  variant = 'dark',
}: { variant?: TopHeaderScrimVariant } = {}): string =>
  cn(
    'sticky top-0 z-40 shrink-0 -mx-4 px-4 pb-[15px] -mb-[15px] pt-[95px]',
    topHeaderScrimClassNames({ variant }),
  )

/** Оболочка экрана: max-width и отступы как у dashboard / profile / chats. */
export const appScreenShellClassNames =
  'relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden overflow-x-hidden bg-background px-4 text-foreground'

export const appScreenTopInsetClassNames = 'pt-[95px]'

export const appScreenBottomInsetClassNames =
  'pb-[calc(2.25rem+env(safe-area-inset-bottom,0px))]'

/** Overlay-панель: вплотную к низу экрана (safe-area — в chrome sheet). */
export const bottomSheetPanelClassNames =
  'relative w-full min-w-0 max-w-md flex items-end !h-auto max-h-[92vh] !bg-transparent shadow-none'

export const bottomSheetChromeClassNames =
  'w-full max-w-md rounded-t-[28px] border-t border-border/30 bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] shadow-[0_-8px_32px_rgba(0,0,0,0.35)]'
