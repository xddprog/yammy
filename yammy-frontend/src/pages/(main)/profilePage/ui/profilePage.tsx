import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useActivateBoost } from '@/entities/user/hooks/useActivateBoost'
import { useFiltersMetadata } from '@/entities/user/hooks/useFiltersMetadata'
import { useUpdateUserProfile } from '@/entities/user/hooks/useUpdateUserProfile'
import { useUserProfileOnProfilePage } from '@/entities/user/hooks/useUserProfile'
import type { ProfilePhotoItem, UserLanguage } from '@/entities/user/types/types'
import type { FiltersState } from '@/features/matches-filter/model/types'
import { useFiltersState } from '@/features/matches-filter/model/useFiltersState'
import { showErrorToast } from '@/shared'
import { stickyTopHeaderClassNames } from '@/widgets'

import { buildProfileUpdateBody, userProfileToFiltersState } from '../lib/profileApiMapper'
import { ProfileEditForm } from './components/profileEditForm'
import { ProfileHeader } from './components/profileHeader'
import { ProfilePageSkeleton } from './components/profilePageSkeleton'
import { ProfileView } from './components/profileView'

type ProfileScreen = 'view' | 'edit'

const ProfilePage = (): JSX.Element => {
  const location = useLocation()
  const navigate = useNavigate()
  const filters = useFiltersState()
  const { data: filtersMetadata } = useFiltersMetadata()
  const activateBoostMutation = useActivateBoost()
  const updateUserProfileMutation = useUpdateUserProfile()
  const { data: profile, status } = useUserProfileOnProfilePage()
  const [screen, setScreen] = useState<ProfileScreen>('view')
  const [draft, setDraft] = useState<FiltersState>(filters.state)
  const [photos, setPhotos] = useState<ProfilePhotoItem[]>([])
  const profileFiltersHydratedRef = useRef(true)
  const openEditFromPromptRef = useRef(false)

  useEffect(() => {
    if (profile?.photos?.length) {
      setPhotos([...profile.photos].sort((a, b) => a.order - b.order))
    }
  }, [profile])

  useEffect(() => {
    if (screen === 'view') {
      setDraft(filters.state)
    }
  }, [filters.state, screen])

  useEffect(() => {
    if (
      screen !== 'edit' ||
      !profile ||
      profileFiltersHydratedRef.current ||
      !filtersMetadata?.length
    ) {
      return
    }
    setDraft((prev) => userProfileToFiltersState(profile, prev, filtersMetadata))
    profileFiltersHydratedRef.current = true
  }, [screen, profile, filtersMetadata])

  const saveProfileSettings = (): void => {
    if (!filtersMetadata?.length) {
      showErrorToast('Не удалось загрузить каталог характеристик. Попробуйте позже.')
      return
    }
    void (async () => {
      try {
        const body = buildProfileUpdateBody(draft, filtersMetadata)
        await updateUserProfileMutation.mutateAsync(body)
        setScreen('view')
      } catch {
        /* throwApiError / mutate уже показали тост */
      }
    })()
  }

  const profileTitle = profile ? `${profile.name}, ${profile.age}` : 'Профиль'

  const openEdit = (): void => {
    profileFiltersHydratedRef.current = Boolean(filtersMetadata?.length)
    if (profile) {
      setDraft(userProfileToFiltersState(profile, filters.state, filtersMetadata ?? undefined))
    }
    if (profile?.photos?.length) {
      setPhotos([...profile.photos].sort((a, b) => a.order - b.order))
    }
    setScreen('edit')
  }

  useEffect(() => {
    const wantEdit = (location.state as { openEdit?: boolean } | null)?.openEdit
    if (!wantEdit || openEditFromPromptRef.current || screen !== 'view' || !profile) return
    openEditFromPromptRef.current = true
    openEdit()
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate, profile, screen])

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden overflow-x-hidden bg-background px-4 text-foreground">
      <div className="min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-x-none pb-28 no-scrollbar">
        <div className="mx-auto flex w-full max-w-md flex-col gap-4 pb-6">
          <header className={stickyTopHeaderClassNames()} aria-hidden />
          <div>
            {screen === 'edit' ? (
              <>
                <ProfileHeader onBack={() => setScreen('view')} onSave={saveProfileSettings} />
                <ProfileEditForm
                  draft={draft}
                  setDraft={setDraft}
                  photos={photos}
                  setPhotos={setPhotos}
                />
              </>
            ) : (
              <>
                <h1 className="mb-2 text-[22px] font-bold uppercase leading-none tracking-tight text-white">
                  Профиль
                </h1>
                {status === 'success' && profile ? (
                  <div className="space-y-3">
                    <ProfileView
                    avatarUrl={profile.photos.find((p) => p.is_main)!.file_path}
                    profileTitle={profileTitle}
                    onOpenEdit={openEdit}
                    profileModerationStatus={profile.profile_moderation_status}
                    profileModerationNote={profile.profile_moderation_note}
                    hasActiveSubscription={profile.has_active_subscription}
                    subscriptionTier={profile.subscription_tier}
                    subscriptionExpiresAt={profile.subscription_expires_at}
                    superlikesCount={profile.superlikes_balance}
                    onBuySuperlikes={() => {
                      showErrorToast('Покупка суперлайков скоро появится')
                    }}
                    boostsCount={profile.boosts_balance}
                    boostExpiresAt={profile.boost_expires_at}
                    notificationsEnabled={profile.notifications_enabled}
                    language={profile.language}
                    referralCode={profile.referral_code ?? ''}
                    adequacyScore={profile.adequacy_score}
                    referralsCount={profile.referrals_count}
                    receivedLikesCount={profile.received_likes_count}
                    sentAppearanceRatingsCount={profile.sent_appearance_ratings_count ?? 0}
                    matchesCount={profile.matches_count}
                    profileViewsCount={profile.profile_views_count}
                    receivedAppearanceRatingsCount={profile.received_appearance_ratings_count}
                    appearanceRatingAverage={profile.appearance_rating_average}
                    onActivateBoost={() => {
                      void activateBoostMutation.mutateAsync()
                    }}
                    onBuyBoostsPackage={() => {
                      showErrorToast('Покупка пакета бустов скоро появится')
                    }}
                    onNotificationsChange={(enabled) => {
                      void updateUserProfileMutation.mutateAsync({ notifications_enabled: enabled })
                    }}
                    onLanguageChange={(lang: UserLanguage) => {
                      void updateUserProfileMutation.mutateAsync({ language: lang })
                    }}
                    settingsUpdating={updateUserProfileMutation.isPending}
                    boostActivating={activateBoostMutation.isPending}
                  />
                  </div>
                ) : (
                  <ProfilePageSkeleton />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
