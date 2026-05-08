import type { JSX } from 'react'

import { SettingsRow } from './settingsRow'
import { SubscriptionCard } from './subscriptionCard'

export const ProfileView = (): JSX.Element => (
  <>
    <SubscriptionCard />

    <section className="flex flex-col gap-3">
      <SettingsRow label="Notifications" value="All" />
      <SettingsRow label="Payment methods" value="Card •••• 1057" />
      <SettingsRow label="Referral link" value="yammy.app/invite/michael" />
    </section>
  </>
)
