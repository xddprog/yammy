import type { JSX } from 'react'
import { useEffect, useState } from 'react'

import type { FiltersState } from '@/features/matches-filter/model/types'
import { useFiltersState } from '@/features/matches-filter/model/useFiltersState'
import { stickyTopHeaderClassNames } from '@/widgets'
import { AVATAR_URL, PROFILE_PHOTOS } from './components/profile.constants'
import { ProfileEditForm } from './components/profileEditForm'
import { ProfileHeader } from './components/profileHeader'
import { ProfileView } from './components/profileView'

type ProfileScreen = 'view' | 'edit'
export interface ProfilePhotoItem {
  id: string
  url: string
  isMain: boolean
}

const ProfilePage = (): JSX.Element => {
  const filters = useFiltersState()
  const [screen, setScreen] = useState<ProfileScreen>('view')
  const [draft, setDraft] = useState<FiltersState>(filters.state)
  const [photos, setPhotos] = useState<ProfilePhotoItem[]>([
    { id: 'photo-main', url: AVATAR_URL, isMain: true },
    ...PROFILE_PHOTOS.map((url, index) => ({ id: `photo-${index}`, url, isMain: false })),
  ])

  useEffect(() => {
    if (screen === 'view') {
      setDraft(filters.state)
    }
  }, [filters.state, screen])

  const saveProfileSettings = () => {
    filters.setState(draft)
    filters.persist()
    setScreen('view')
  }

  const mainPhoto = photos.find((photo) => photo.isMain) ?? photos[0]
  const profileTitle = `Michael, ${Math.round((draft.ageRange[0] + draft.ageRange[1]) / 2)}`

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
                <ProfileView
                  avatarUrl={mainPhoto?.url ?? AVATAR_URL}
                  profileTitle={profileTitle}
                  onOpenEdit={() => setScreen('edit')}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
