import type { JSX } from 'react'

import { Skeleton } from '@/shared'

export const LikesPageSkeleton = (): JSX.Element => (
  <div className="grid grid-cols-2 gap-[15px]" aria-busy aria-label="Загрузка лайков">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="w-full">
        <Skeleton className="aspect-[3/4] w-full rounded-[24px]" />
        <div className="mt-2 flex flex-col gap-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      </div>
    ))}
  </div>
)
