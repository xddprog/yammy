import type { JSX } from 'react'

import type { UserLanguage } from '@/entities/user/types/types'

import { ProfileMainRow } from './profileMainRow'
import {
  ProfileAdequacySheetRow,
  ProfileBoostsSheetRow,
  ProfileLanguageSheetRow,
  ProfileNotificationsSheetRow,
  ProfileReferralSheetRow,
  ProfileSuperlikesSheetRow,
} from './profileViewSettingsSheets'
import { SubscriptionCard } from './subscriptionCard'

interface ProfileViewProps {
  avatarUrl: string
  profileTitle: string
  onOpenEdit: () => void
  hasActiveSubscription: boolean
  subscriptionTier: string
  subscriptionExpiresAt: string | null
  superlikesCount: number
  onBuySuperlikes: () => void
  boostsCount: number
  boostExpiresAt: string | null
  notificationsEnabled: boolean
  language: UserLanguage
  referralCode: string
  adequacyScore: number
  referralsCount: number
  onActivateBoost: () => void
  onBuyBoostsPackage: () => void
  onNotificationsChange: (enabled: boolean) => void
  onLanguageChange: (lang: UserLanguage) => void
  settingsUpdating?: boolean
  boostActivating?: boolean
}

export const ProfileView = ({
  avatarUrl,
  profileTitle,
  onOpenEdit,
  hasActiveSubscription,
  subscriptionTier,
  subscriptionExpiresAt,
  superlikesCount,
  onBuySuperlikes,
  boostsCount,
  boostExpiresAt,
  notificationsEnabled,
  language,
  referralCode,
  adequacyScore,
  referralsCount,
  onActivateBoost,
  onBuyBoostsPackage,
  onNotificationsChange,
  onLanguageChange,
  settingsUpdating,
  boostActivating,
}: ProfileViewProps): JSX.Element => (
  <>
    <ProfileMainRow avatarUrl={avatarUrl} title={profileTitle} onOpenEdit={onOpenEdit} />

    <section className="mt-5 flex flex-col gap-1.5">
      <SubscriptionCard
        hasActiveSubscription={hasActiveSubscription}
        subscriptionTier={subscriptionTier}
        subscriptionExpiresAt={subscriptionExpiresAt}
      />
    </section>

    <section className="mt-5 flex flex-col gap-1.5">
      <ProfileSuperlikesSheetRow
        superlikesCount={superlikesCount}
        onBuySuperlikes={onBuySuperlikes}
      />
      <ProfileBoostsSheetRow
        boostsCount={boostsCount}
        boostExpiresAt={boostExpiresAt}
        onActivate={onActivateBoost}
        onBuyBoostsPackage={onBuyBoostsPackage}
        activating={boostActivating}
      />
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
