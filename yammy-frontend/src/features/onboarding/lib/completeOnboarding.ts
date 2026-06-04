import { finishOnboarding } from '@/entities/auth/api/authService'
import type { ProfilePhotoItem } from '@/entities/user/types/types'

import { buildOnboardingUpdateBody } from './buildOnboardingUpdateBody'
import type { OnboardingDraft } from './onboardingDraft'

export type LocalOnboardingPhoto = ProfilePhotoItem & { localFile: File }

export async function completeOnboarding(
  draft: OnboardingDraft,
  photos: LocalOnboardingPhoto[],
  notificationsEnabled: boolean,
): Promise<void> {
  const ordered = [...photos].sort((a, b) => a.order - b.order)
  if (!ordered.some((p) => p.is_main)) {
    throw new Error('Нужно главное фото')
  }

  await finishOnboarding(
    {
      ...buildOnboardingUpdateBody(draft, notificationsEnabled),
      photos: ordered.map((p) => ({ order: p.order, is_main: p.is_main })),
    },
    ordered.map((p) => p.localFile),
  )
}
