import { cn } from '@/shared'

const stickyTopScrimDark =
  '[background-image:linear-gradient(to_bottom,rgb(0_0_0/0.97)_0%,rgb(0_0_0/0.90)_20%,rgb(0_0_0/0.72)_42%,rgb(0_0_0/0.50)_68%,rgb(0_0_0/0.26)_88%]'

const stickyTopScrimOnBackground =
  '[background-image:linear-gradient(to_bottom,rgb(0_0_0/0.92)_0%,rgb(0_0_0/0.80)_22%,rgb(0_0_0/0.54)_45%,rgb(0_0_0/0.30)_70%,rgb(0_0_0/0.14)_90%,rgb(0_0_0/0)_100%)]'

/** Sticky верх страницы: контент скроллится под градиент и визуально затемняется */
export const stickyTopHeaderClassNames = ({
  variant = 'dark',
}: {
  variant?: 'dark' | 'background'
} = {}) =>
  cn(
    'sticky top-0 z-40 shrink-0 -mx-4 px-4 pb-[10px] pt-[95px] -mb-[10px]',
    variant === 'dark' ? stickyTopScrimDark : stickyTopScrimOnBackground,
  )
