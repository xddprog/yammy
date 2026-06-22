import type { JSX } from 'react'

import { Skeleton } from '@/shared'

export const ProfilePageSkeleton = (): JSX.Element => (
  <div className="flex flex-col gap-4" aria-busy aria-label="Загрузка профиля">
    <div className="flex w-full items-center gap-3 rounded-[28px] px-4 py-4.5">
      <Skeleton className="size-[66px] shrink-0 rounded-full" />
      <Skeleton className="h-4 min-w-0 flex-1 rounded-md" />
      <Skeleton className="size-4 shrink-0 rounded-sm" />
    </div>

    <section className="mt-1 grid grid-cols-3 gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={`stats-primary-${i}`} className="h-[58px] w-full rounded-[18px]" />
      ))}
    </section>

    <section className="grid grid-cols-3 gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={`stats-secondary-${i}`} className="h-[58px] w-full rounded-[18px]" />
      ))}
    </section>

    <section className="mt-1 flex flex-col gap-1.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] w-full rounded-[28px]" />
      ))}
    </section>
  </div>
)
