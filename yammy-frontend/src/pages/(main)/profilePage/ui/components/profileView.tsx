import type { JSX } from 'react'

import type { UserLanguage } from '@/entities/user/types/types'

import { ProfileMainRow } from './profileMainRow'
import {
  ProfileAdequacySheetRow,
  ProfileLanguageSheetRow,
  ProfileNotificationsSheetRow,
  ProfileReferralSheetRow,
} from './profileViewSettingsSheets'
import { SettingsRow } from './settingsRow'
import { SubscriptionCard } from './subscriptionCard'

interface ProfileViewProps {
  avatarUrl: string
  profileTitle: string
  onOpenEdit: () => void
  superlikesCount: number
  boostsCount: number
  notificationsEnabled: boolean
  language: UserLanguage
  referralCode: string
  adequacyScore: number
  referralsCount: number
  onNotificationsChange: (enabled: boolean) => void
  onLanguageChange: (lang: UserLanguage) => void
  settingsUpdating?: boolean
}

export const ProfileView = ({
  avatarUrl,
  profileTitle,
  onOpenEdit,
  superlikesCount,
  boostsCount,
  notificationsEnabled,
  language,
  referralCode,
  adequacyScore,
  referralsCount,
  onNotificationsChange,
  onLanguageChange,
  settingsUpdating,
}: ProfileViewProps): JSX.Element => (
  <>
    <ProfileMainRow avatarUrl={avatarUrl} title={profileTitle} onOpenEdit={onOpenEdit} />

    <section className="mt-5 flex flex-col gap-1.5">
      <SubscriptionCard />
    </section>

    <section className="mt-5 flex flex-col gap-1.5">
      <SettingsRow label="Суперлайки" value={String(superlikesCount)} />
      <SettingsRow label="Бусты" value={String(boostsCount)} />
      <ProfileNotificationsSheetRow
        enabled={notificationsEnabled}
        onApply={onNotificationsChange}
        disabled={settingsUpdating}
      />
      <ProfileLanguageSheetRow
        language={language}
        onApply={onLanguageChange}
        disabled={settingsUpdating}
      />
      <ProfileReferralSheetRow referralsCount={referralsCount} referralCode={referralCode} />
      <ProfileAdequacySheetRow adequacyScore={adequacyScore} />
    </section>
  </>
)
