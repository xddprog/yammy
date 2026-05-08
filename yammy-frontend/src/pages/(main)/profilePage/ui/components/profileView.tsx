import type { JSX } from 'react'

import { SettingsRow } from './settingsRow'
import { SubscriptionCard } from './subscriptionCard'

export const ProfileView = (): JSX.Element => (
  <>
    <SubscriptionCard />

    <section className="flex flex-col gap-1.5 mt-5">
      <SettingsRow label="Уведомления" value="On" />
      <SettingsRow label="Способ оплаты" value="•••• 1057" />
      <SettingsRow label="Рефералы" value="7" />
    </section>
  </>
)
