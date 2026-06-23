import type { GenderOption } from '@/features/matches-filter/lib/constants'

export type AiSearchTargetGender = 'male' | 'female'

export const AI_SEARCH_GENDER_TO_API: Record<GenderOption, AiSearchTargetGender> = {
  Мужской: 'male',
  Женский: 'female',
}

export const AI_SEARCH_GENDER_LABELS: Record<AiSearchTargetGender, string> = {
  male: 'Мужчины',
  female: 'Женщины',
}

export interface AiSearchCreatePayload {
  query_text: string
  target_gender: AiSearchTargetGender
}
