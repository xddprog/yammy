import type { UserUpdateRequestDto } from '@/entities/user/types/types'

import type { OnboardingDraft } from './onboardingDraft'

const GENDER_TO_API: Record<NonNullable<OnboardingDraft['gender']>, 'male' | 'female'> = {
  Мужской: 'male',
  Женский: 'female',
}

export function buildOnboardingUpdateBody(
  draft: OnboardingDraft,
  notificationsEnabled: boolean,
): UserUpdateRequestDto {
  return {
    name: draft.name.trim(),
    age: draft.age as number,
    gender: GENDER_TO_API[draft.gender!],
    city: draft.city.trim(),
    relationship_goal: draft.relationshipGoal!,
    education_level: draft.educationLevel!,
    ...(draft.educationLevel === 'higher' && draft.educationInstitution.trim()
      ? { education_details: draft.educationInstitution.trim() }
      : {}),
    bio: draft.bio.trim() || '',
    filters: draft.filterOptionIds,
    notifications_enabled: notificationsEnabled,
  }
}
