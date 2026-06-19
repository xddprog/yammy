import type { JSX } from 'react'

import { Skeleton } from '@/shared'

export const ChatsPageSkeleton = (): JSX.Element => (
  <div className="flex flex-col gap-4" aria-busy aria-label="Загрузка чатов">

    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex w-full items-center gap-3 rounded-[28px] bg-[#111111] px-4 py-3.5">
          <Skeleton className="size-[52px] shrink-0 rounded-full bg-neutral-800" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-32 rounded-md bg-neutral-800" />
              <Skeleton className="h-3 w-10 rounded-md bg-neutral-800" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3 w-full max-w-[190px] rounded-md bg-neutral-800" />
              <Skeleton className="h-6 w-6 shrink-0 rounded-full bg-neutral-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)
