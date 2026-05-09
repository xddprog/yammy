import type { JSX } from 'react'

import { ProfileMainRow } from './profileMainRow'
import { SettingsRow } from './settingsRow'
import { SubscriptionCard } from './subscriptionCard'

interface ProfileViewProps {
  avatarUrl: string
  profileTitle: string
  onOpenEdit: () => void
  superlikesCount: number
  boostsCount: number
  notificationsEnabled: boolean
  adequacyScore: number
  referralsCount: number
}

const formatNotifications = (enabled: boolean): string => (enabled ? 'Вкл.' : 'Выкл.')

export const ProfileView = ({
  avatarUrl,
  profileTitle,
  onOpenEdit,
  superlikesCount,
  boostsCount,
  notificationsEnabled,
  adequacyScore,
  referralsCount,
}: ProfileViewProps): JSX.Element => (
  <>
    <ProfileMainRow avatarUrl={avatarUrl} title={profileTitle} onOpenEdit={onOpenEdit} />

    <section className="mt-5 flex flex-col gap-1.5">
      <SubscriptionCard />
    </section>

    <section className="mt-5 flex flex-col gap-1.5">
      <SettingsRow label="Суперлайки" value={String(superlikesCount)} />
      <SettingsRow label="Бусты" value={String(boostsCount)} />
      <SettingsRow label="Уведомления" value={formatNotifications(notificationsEnabled)} />
      <SettingsRow label="Язык" value="Русский" />
      <SettingsRow label="Рефералы" value={String(referralsCount)} />
      <SettingsRow label="Рейтинг адекватности" value={adequacyScore?.toFixed(1)} />
    </section>
  </>
)
