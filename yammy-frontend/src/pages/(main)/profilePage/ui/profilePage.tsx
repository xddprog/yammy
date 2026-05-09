import type { JSX } from 'react'
import { useEffect, useState } from 'react'

import { useUserProfile } from '@/entities/user/hooks/useUserProfile'
import type { ProfilePhotoItem } from '@/entities/user/types/types'
import type { FiltersState } from '@/features/matches-filter/model/types'
import { useFiltersState } from '@/features/matches-filter/model/useFiltersState'
import { stickyTopHeaderClassNames } from '@/widgets'
import { ProfileEditForm } from './components/profileEditForm'
import { ProfileHeader } from './components/profileHeader'
import { ProfilePageSkeleton } from './components/profilePageSkeleton'
import { ProfileView } from './components/profileView'

type ProfileScreen = 'view' | 'edit'

const ProfilePage = (): JSX.Element => {
  const filters = useFiltersState()
  const { data: profile, status } = useUserProfile()
  const [screen, setScreen] = useState<ProfileScreen>('view')
  const [draft, setDraft] = useState<FiltersState>(filters.state)
  const [photos, setPhotos] = useState<ProfilePhotoItem[]>([])

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

  const saveProfileSettings = (): void => {
    filters.setState(draft)
    filters.persist()
    setScreen('view')
  }

  const profileTitle = profile ? `${profile.name}, ${profile.age}` : 'Профиль'

  const openEdit = (): void => {
    if (profile?.photos?.length) {
      setPhotos([...profile.photos].sort((a, b) => a.order - b.order))
    }
    setScreen('edit')
  }

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
                    superlikesCount={profile.superlikes_balance}
                    boostsCount={profile.boosts_balance}
                    notificationsEnabled={profile.notifications_enabled}
                    adequacyScore={profile.adequacy_score}
                    referralsCount={profile.referrals_count}
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
