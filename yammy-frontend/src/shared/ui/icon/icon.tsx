import { cn } from '@shared/lib/mergeClass'
import * as React from 'react'

type IconSize = number | string

type SvgIconProps = React.SVGAttributes<SVGSVGElement> & {
  /**
   * Имя иконки соответствует пути к svg-файлу в `src/shared/assets`,
   * без расширения. Например:
   *   - `heart.svg` → `name="heart"`
   *   - `common/close.svg` → `name="common/close"`
   */
  name: string
  /**
   * Размер контейнера иконки. По умолчанию 24.
   * Можно передать число (px) или строку (например, '1.5rem').
   */
  size?: IconSize
}

const SvgIcon = React.forwardRef<SVGSVGElement, SvgIconProps>(function SvgIcon(
  { name, size = 24, className, ...props },
  ref,
) {
  const dimension = typeof size === 'number' ? size : (size ?? 24)

  return (
    <svg
      ref={ref}
      data-slot="icon"
      width={dimension}
      height={dimension}
      className={cn('inline-block fill-current stroke-current', className)}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    >
      <use href={`/sprite.svg#${name}`} />
    </svg>
  )
})

export { SvgIcon }
export type { SvgIconProps }
