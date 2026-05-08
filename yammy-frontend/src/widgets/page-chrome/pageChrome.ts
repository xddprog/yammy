import { cn } from '@/shared'

const stickyTopScrimDark =
  '[background-image:linear-gradient(to_bottom,rgb(0_0_0/0.98)_0%,rgb(0_0_0/0.94)_12%,rgb(0_0_0/0.88)_24%,rgb(0_0_0/0.76)_42%,rgb(0_0_0/0.56)_68%,rgb(0_0_0/0.32)_88%,rgb(0_0_0/0)_100%)]'

const stickyTopScrimOnBackground =
  '[background-image:linear-gradient(to_bottom,rgb(0_0_0/0.96)_0%,rgb(0_0_0/0.90)_12%,rgb(0_0_0/0.82)_26%,rgb(0_0_0/0.68)_45%,rgb(0_0_0/0.48)_70%,rgb(0_0_0/0.26)_90%,rgb(0_0_0/0)_100%)]'

/** Sticky верх страницы: контент скроллится под градиент и визуально затемняется */
export const stickyTopHeaderClassNames = ({
  variant = 'dark',
}: {
  variant?: 'dark' | 'background'
} = {}) =>
  cn(
    'sticky top-0 z-40 shrink-0 -mx-4 -mb-[15px] px-4 pb-[15px] pt-[95px]',
    variant === 'dark' ? stickyTopScrimDark : stickyTopScrimOnBackground,
  )
