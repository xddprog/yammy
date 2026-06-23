import type { JSX } from 'react'
import { memo } from 'react'

import type { UserLanguage } from '@/entities/user/types/types'
import { cn, useOverlay } from '@/shared'
import { bottomSheetPanelClassNames } from '@/widgets'

import { ProfileMainRow } from './profileMainRow'
import {
  ProfileAdequacySheetRow,
  ProfileBoostsSheetRow,
  ProfileLanguageSheetRow,
  ProfileNotificationsSheetRow,
  ProfileReferralSheetRow,
  ProfileStatInfoSheetContent,
  ProfileSuperlikesSheetRow,
} from './profileViewSettingsSheets'
import { SubscriptionCard } from './subscriptionCard'

interface ProfileStatChip {
  label: string
  value: string
  description: string
}

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
  sentAppearanceRatingsCount: number
  matchesCount: number
  profileViewsCount: number
  receivedAppearanceRatingsCount: number
  appearanceRatingAverage: number | null
  onActivateBoost: () => void
  onBuyBoostsPackage: () => void
  onNotificationsChange: (enabled: boolean) => void
  onLanguageChange: (lang: UserLanguage) => void
  settingsUpdating?: boolean
  boostActivating?: boolean
}

const formatCount = (value: number): string => value.toLocaleString('ru-RU')

const formatAverageRating = (value: number | null): string =>
  value != null
    ? value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : '—'

const ProfileStatsRow = memo(function ProfileStatsRow({
  stats,
}: {
  stats: ProfileStatChip[]
}): JSX.Element {
  const { open } = useOverlay()

  return (
    <section className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <button
          key={stat.label}
          type="button"
          aria-label={stat.label}
          onClick={() =>
            open({
              backdropClassName: 'bg-black/50 backdrop-blur-sm',
              panelClassName: bottomSheetPanelClassNames,
              content: (close) => (
                <ProfileStatInfoSheetContent
                  title={stat.label}
                  value={stat.value}
                  description={stat.description}
                  close={close}
                />
              ),
            })
          }
          className={cn(
            'min-w-0 rounded-[18px] bg-card px-3 py-3 text-center transition-colors',
            'hover:bg-card/85 active:scale-[0.99]',
          )}
        >
          <p className="truncate text-[11px] font-[200] uppercase tracking-[0.04em] text-muted-foreground">
            {stat.label}
          </p>
          <p className="mt-1 truncate text-[13px] font-[200] text-foreground">{stat.value}</p>
        </button>
      ))}
    </section>
  )
})

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
  sentAppearanceRatingsCount,
  matchesCount,
  profileViewsCount,
  receivedAppearanceRatingsCount,
  appearanceRatingAverage,
  onActivateBoost,
  onBuyBoostsPackage,
  onNotificationsChange,
  onLanguageChange,
  settingsUpdating,
  boostActivating,
}: ProfileViewProps): JSX.Element => {
  const primaryStats: ProfileStatChip[] = [
    {
      label: 'Лайкнули',
      value: formatCount(receivedLikesCount),
      description:
        'Сколько лайков и суперлайков вы получили от других пользователей за всё время.',
    },
    {
      label: 'Мэтчи',
      value: formatCount(matchesCount),
      description: 'Взаимные лайки — когда вы и другой человек лайкнули друг друга.',
    },
    {
      label: 'Просмотры',
      value: formatCount(profileViewsCount),
      description: 'Сколько раз другие пользователи открывали вашу анкету.',
    },
  ]

  const secondaryStats: ProfileStatChip[] = [
    {
      label: 'Ср. оценка',
      value: formatAverageRating(appearanceRatingAverage),
      description: 'Средний балл внешности по всем полученным оценкам от других пользователей.',
    },
    {
      label: 'Оценки',
      value: formatCount(receivedAppearanceRatingsCount),
      description: 'Сколько оценок внешности вы получили от других пользователей за всё время.',
    },
    {
      label: 'Мои оценки',
      value: formatCount(sentAppearanceRatingsCount),
      description: 'Сколько оценок внешности вы поставили другим пользователям.',
    },
  ]

  return (
    <>
      <ProfileMainRow avatarUrl={avatarUrl} title={profileTitle} onOpenEdit={onOpenEdit} />

      <div className="mt-2 flex flex-col gap-2">
        <ProfileStatsRow stats={primaryStats} />
        <ProfileStatsRow stats={secondaryStats} />
      </div>

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
