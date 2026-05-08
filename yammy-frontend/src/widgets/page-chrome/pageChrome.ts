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
