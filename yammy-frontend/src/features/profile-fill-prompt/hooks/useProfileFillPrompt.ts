import { useCallback, useMemo, useState } from 'react'

import { useUserProfile } from '@/entities/user/hooks/useUserProfile'
import { hasCompletedAppGuide } from '@/features/app-guide'

import { isProfileThinlyFilled } from '../lib/isProfileThinlyFilled'
import {
  markProfileFillPromptHandledToday,
  wasProfileFillPromptHandledToday,
} from '../lib/profileFillPromptStorage'

/**
 * Плашка на ленте: профиль слабо заполнен + первый свайп за день + ещё не закрывали сегодня.
 */
export function useProfileFillPrompt(): {
  visible: boolean
  dismissForToday: () => void
  notifyAfterSwipe: () => void
} {
  const { data: profile } = useUserProfile()
  const [armedAfterSwipe, setArmedAfterSwipe] = useState(false)

  const eligible = useMemo(
    () => Boolean(profile && isProfileThinlyFilled(profile)),
    [profile],
  )

  const visible =
    eligible && armedAfterSwipe && !wasProfileFillPromptHandledToday() && hasCompletedAppGuide()

  const notifyAfterSwipe = useCallback(() => {
    if (!profile || !isProfileThinlyFilled(profile)) return
    if (wasProfileFillPromptHandledToday()) return
    setArmedAfterSwipe(true)
  }, [profile])

  const dismissForToday = useCallback(() => {
    markProfileFillPromptHandledToday()
    setArmedAfterSwipe(false)
  }, [])

  return { visible, dismissForToday, notifyAfterSwipe }
}
