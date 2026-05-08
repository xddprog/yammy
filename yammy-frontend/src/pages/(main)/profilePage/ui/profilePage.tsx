import type { JSX } from 'react'
import { useEffect, useState } from 'react'

import type { FiltersState } from '@/features/matches-filter/model/types'
import { useFiltersState } from '@/features/matches-filter/model/useFiltersState'
import { AVATAR_URL } from './components/profile.constants'
import { ProfileEditForm } from './components/profileEditForm'
import { ProfileHeader } from './components/profileHeader'
import { ProfileView } from './components/profileView'

type ProfileScreen = 'view' | 'edit'

const ProfilePage = (): JSX.Element => {
  const filters = useFiltersState()
  const [screen, setScreen] = useState<ProfileScreen>('view')
  const [draft, setDraft] = useState<FiltersState>(filters.state)

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

  return (
    <div className="h-full min-h-0 overflow-y-auto no-scrollbar pb-28 text-foreground">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 px-0 pb-6 pt-3">
        <ProfileHeader
          screen={screen}
          title={`Michael, ${Math.round((draft.ageRange[0] + draft.ageRange[1]) / 2)}`}
          avatarUrl={AVATAR_URL}
          onBack={() => setScreen('view')}
          onSave={saveProfileSettings}
          onOpenEdit={() => setScreen('edit')}
        />

        {screen === 'view' ? (
          <ProfileView />
        ) : (
          <ProfileEditForm draft={draft} setDraft={setDraft} />
        )}
      </div>
    </div>
  )
}

export default ProfilePage
