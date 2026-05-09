import type { JSX } from 'react'

import { ProfileMainRow } from './profileMainRow'
import { SettingsRow } from './settingsRow'
import { SubscriptionCard } from './subscriptionCard'

interface ProfileViewProps {
  avatarUrl: string
  profileTitle: string
  onOpenEdit: () => void
}

export const ProfileView = ({
  avatarUrl,
  profileTitle,
  onOpenEdit,
}: ProfileViewProps): JSX.Element => (
  <>
    <ProfileMainRow avatarUrl={avatarUrl} title={profileTitle} onOpenEdit={onOpenEdit} />

    <section className="flex flex-col gap-1.5 mt-5">
      <SubscriptionCard />
    </section>

    <section className="mt-5 flex flex-col gap-1.5">
      <SettingsRow label="Уведомления" value="On" />
      <SettingsRow label="Способ оплаты" value="•••• 1057" />
      <SettingsRow label="Язык" value="Русский" />
      <SettingsRow label="Рефералы" value="7" />
    </section>
  </>
)
