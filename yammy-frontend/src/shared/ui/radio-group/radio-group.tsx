'use client'

import { cn } from '@shared/lib/mergeClass'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import * as React from 'react'

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'relative flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-transparent bg-[#13131340] transition-colors outline-none cursor-pointer',
        'data-[state=checked]:bg-white data-[state=checked]:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="pointer-events-none absolute inset-[2px] flex items-center justify-center"
      >
        <span className="block size-4 rounded-full bg-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
