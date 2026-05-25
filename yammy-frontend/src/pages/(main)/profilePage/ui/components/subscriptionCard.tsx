import { Crown } from 'lucide-react'
import type { JSX } from 'react'


import { Button } from '@/shared'
import { formatSubscriptionExpiresAt, SUBSCRIPTION_PITCH } from '@/entities/user/lib/subscriptionDisplay'

interface SubscriptionCardProps {
  hasActiveSubscription: boolean
  subscriptionTier: string
  subscriptionExpiresAt: string | null
}

export const SubscriptionCard = ({
  hasActiveSubscription,
  subscriptionTier,
  subscriptionExpiresAt,
}: SubscriptionCardProps): JSX.Element => (
  <section className="overflow-hidden rounded-[30px] bg-white p-5 text-black">
    <div className="mb-4 flex items-end justify-between gap-3">
      <p className="text-[28px] font-bold leading-none">
        {hasActiveSubscription ? subscriptionTier : 'Базовая'}
      </p>
      <Crown className="size-10 shrink-0 text-[#FF6BA4]" />
    </div>
    {hasActiveSubscription ? (
      <div className="flex items-end justify-between gap-3">
        <p className="text-[11px] font-[300] uppercase tracking-[0.04em] text-muted-foreground">Срок</p>
        <p className="text-right text-[13px] font-bold leading-none">
          {formatSubscriptionExpiresAt(subscriptionExpiresAt)}
        </p>
      </div>
    ) : (
      <p className="text-[13px] font-[200] leading-snug text-muted-foreground">{SUBSCRIPTION_PITCH}</p>
    )}
    <div className="mt-4">
      <Button type="button" variant="black" size="default" className="w-full rounded-full">
        {hasActiveSubscription ? 'Управлять' : 'Подробнее'}
      </Button>
    </div>
  </section>
)
