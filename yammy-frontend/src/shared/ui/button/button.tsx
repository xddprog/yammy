import { cn } from '@shared/lib/mergeClass'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { Slot } from 'radix-ui'
import * as React from 'react'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-light transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-[#FF6BA4] text-white hover:bg-[#FF6BA4]/90 active:bg-[#FF6BA4]/80 focus-visible:ring-[#FF6BA4]/50 disabled:bg-[#FF6BA4]/60 disabled:text-white/80',
        black:
          'bg-black text-white hover:bg-black/90 active:bg-black/80 focus-visible:ring-black/50 disabled:bg-black/60 disabled:text-white/70',
        white:
          'bg-white text-black border border-input hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-input disabled:bg-gray-100 disabled:text-gray-500',
        'white-pink':
          'bg-white dark:bg-transparent text-[#FF6BA4] border border-[#FF6BA4] hover:bg-[#FF6BA4]/10 active:bg-[#FF6BA4]/20 focus-visible:ring-[#FF6BA4]/50 disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground active:bg-accent/80 dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90',
        ghost:
          'hover:bg-accent hover:text-accent-foreground active:bg-accent/80 dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline active:text-primary/90',
      },
      size: {
        default: 'px-7 py-3.5 text-sm has-[>svg]:px-5',
        xs: "gap-1 rounded-full px-4 py-[10px] text-[10px] has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-3",
        sm: 'rounded-full gap-1.5 px-6 py-[13px] text-xs has-[>svg]:px-4',
        lg: 'rounded-full px-9 py-4 text-base has-[>svg]:px-6',
        icon: 'p-[17px]',
        'icon-xs': "p-[11px] rounded-full [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'p-[14px]',
        'icon-lg': 'p-5',
        'icon-xl': 'p-6',
        'icon-2xl': 'p-7',
        'icon-3xl': 'p-8',
        'icon-4xl': 'p-9',
        'icon-5xl': 'p-10',
        'icon-6xl': 'p-11',
        'icon-7xl': 'p-12',
        'icon-8xl': 'p-13',
        'icon-9xl': 'p-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    isLoader?: boolean
  }

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  isLoader = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  const content =
    !asChild && isLoader ? (
      <>
        <Loader2 className="animate-spin" aria-hidden />
        {children}
      </>
    ) : (
      children
    )

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={isLoader || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoader}
      {...props}
    >
      {content}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
