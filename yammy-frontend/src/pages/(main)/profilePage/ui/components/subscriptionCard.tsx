import { Crown } from 'lucide-react'
import type { JSX } from 'react'

export const SubscriptionCard = (): JSX.Element => (
  <section className="overflow-hidden rounded-[30px] bg-white p-5 text-black">
    <div className="mb-2 flex items-center justify-between gap-3">
      <div>
        <p className="text-[32px] font-bold leading-none">Match+</p>
      </div>
      <Crown className="size-10 shrink-0 text-[#FF6BA4]" />
    </div>
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-end justify-between gap-3">
        <p className="text-[12px] font-[200] uppercase tracking-[0.04em] text-muted-foreground">Срок</p>
        <p className="text-[12px] font-bold leading-none text-right">1 мес.</p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-[12px] font-[200] uppercase tracking-[0.04em] text-muted-foreground">Цена</p>
        <p className="text-[12px] font-bold leading-none text-right">Match+</p>
      </div>
    </div>
  </section>
)
