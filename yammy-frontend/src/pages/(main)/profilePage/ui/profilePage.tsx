import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useFiltersMetadata } from '@/entities/user/hooks/useFiltersMetadata'
import { useUpdateUserProfile } from '@/entities/user/hooks/useUpdateUserProfile'
import { useUserProfile } from '@/entities/user/hooks/useUserProfile'
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
  const updateUserProfileMutation = useUpdateUserProfile()
  const { data: profile, status } = useUserProfile()
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
    if (screen !== 'edit' || !profile || profileFiltersHydratedRef.current || !filtersMetadata?.length) {
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
        filters.setState(draft)
        filters.persist()
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
          <header
            className={stickyTopHeaderClassNames({ variant: 'background' })}
            aria-hidden
          />
          <div>
            {screen === 'edit' ? (
              <>
                <ProfileHeader onBack={() => setScreen('view')} onSave={saveProfileSettings} />
                <ProfileEditForm draft={draft} setDraft={setDraft} photos={photos} setPhotos={setPhotos} />
              </>
            ) : (
              <>
                <h1 className="mb-2 text-[22px] font-bold uppercase leading-none tracking-tight text-white">
                  Профиль
                </h1>
                {status === 'success' && profile ? (
                  <ProfileView
                    avatarUrl={profile.photos.find((p) => p.is_main)!.file_path}
                    profileTitle={profileTitle}
                    onOpenEdit={openEdit}
                    hasActiveSubscription={profile.has_active_subscription}
                    subscriptionTier={profile.subscription_tier}
                    subscriptionExpiresAt={profile.subscription_expires_at}
                    superlikesCount={profile.superlikes_balance}
                    boostsCount={profile.boosts_balance}
                    notificationsEnabled={profile.notifications_enabled}
                    language={profile.language}
                    referralCode={profile.referral_code ?? ''}
                    adequacyScore={profile.adequacy_score}
                    referralsCount={profile.referrals_count}
                    onNotificationsChange={(enabled) => {
                      void updateUserProfileMutation.mutateAsync({ notifications_enabled: enabled })
                    }}
                    onLanguageChange={(lang: UserLanguage) => {
                      void updateUserProfileMutation.mutateAsync({ language: lang })
                    }}
                    settingsUpdating={updateUserProfileMutation.isPending}
                  />
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
