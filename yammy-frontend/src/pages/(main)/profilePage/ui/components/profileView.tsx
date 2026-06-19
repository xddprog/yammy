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
  receivedLikesCount: number
  matchesCount: number
  profileViewsCount: number
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
  receivedLikesCount,
  matchesCount,
  profileViewsCount,
  onActivateBoost,
  onBuyBoostsPackage,
  onNotificationsChange,
  onLanguageChange,
  settingsUpdating,
  boostActivating,
}: ProfileViewProps): JSX.Element => {
  const stats = [
    { label: 'Лайкнули', value: receivedLikesCount },
    { label: 'Мэтчи', value: matchesCount },
    { label: 'Просмотры', value: profileViewsCount },
  ]

  return (
    <>
      <ProfileMainRow avatarUrl={avatarUrl} title={profileTitle} onOpenEdit={onOpenEdit} />

      <section className="mt-2 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-[18px] bg-card px-3 py-3 text-center">
            <p className="truncate text-[11px] font-[200] uppercase tracking-[0.04em] text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1 truncate text-[13px] font-[200] text-foreground">
              {stat.value.toLocaleString('ru-RU')}
            </p>
          </div>
        ))}
      </section>

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
}
