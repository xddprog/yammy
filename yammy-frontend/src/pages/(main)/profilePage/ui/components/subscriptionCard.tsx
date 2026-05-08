import { Crown } from 'lucide-react'
import type { JSX } from 'react'

import { Button } from '@/shared'

export const SubscriptionCard = (): JSX.Element => (
  <section className="overflow-hidden rounded-[30px] bg-white p-5 text-black mt-5">
    <div className="mb-4 flex items-end justify-between gap-3">
      <p className="text-[28px] font-bold leading-none">Match+</p>
      <Crown className="size-10 shrink-0 text-[#FF6BA4]" />
    </div>
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-end justify-between gap-3">
        <p className="text-[11px] font-[300] uppercase tracking-[0.04em] text-muted-foreground">Срок</p>
        <p className="text-[13px] font-bold leading-none text-right">1 мес.</p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-[11px] font-[300] uppercase tracking-[0.04em] text-muted-foreground">Цена</p>
        <p className="text-[13px] font-bold leading-none text-right">Match+</p>
      </div>
    </div>
    <div className="mt-4">
      <Button type="button" variant="black" size="default" className="w-full rounded-full">
        Управлять
      </Button>
    </div>
  </section>
)
