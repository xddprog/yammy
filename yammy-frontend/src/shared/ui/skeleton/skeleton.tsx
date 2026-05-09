import type { ComponentPropsWithoutRef, JSX } from 'react'

import { cn } from '@/shared/lib/mergeClass'

export type SkeletonProps = ComponentPropsWithoutRef<'div'>


export const Skeleton = ({ className, ...rest }: SkeletonProps): JSX.Element => (
  <div className={cn('yammy-skeleton rounded-md bg-card', className)} {...rest} />
)
