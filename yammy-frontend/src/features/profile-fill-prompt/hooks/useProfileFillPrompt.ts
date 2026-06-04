import { useCallback, useMemo, useState } from 'react'

import { useUserProfile } from '@/entities/user/hooks/useUserProfile'

import { isProfileThinlyFilled } from '../lib/isProfileThinlyFilled'

/** Временно: показ после каждого свайпа, без лимита раз в день. */
export function useProfileFillPrompt(): {
  visible: boolean
  dismiss: () => void
  notifyAfterSwipe: () => void
} {
  const { data: profile } = useUserProfile()
  const [hasSwiped, setHasSwiped] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const eligible = useMemo(
    () => Boolean(profile && isProfileThinlyFilled(profile)),
    [profile],
  )

  const visible = eligible && hasSwiped && !dismissed

  const notifyAfterSwipe = useCallback(() => {
    if (!profile || !isProfileThinlyFilled(profile)) return
    setHasSwiped(true)
    setDismissed(false)
  }, [profile])

  const dismiss = useCallback(() => {
    setDismissed(true)
  }, [])

  return { visible, dismiss, notifyAfterSwipe }
}
