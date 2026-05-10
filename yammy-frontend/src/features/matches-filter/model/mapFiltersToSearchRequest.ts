import type { SearchUsersRequest } from '@/entities/user/types/types'

import type { FiltersState } from './types'

const GENDER_TO_API: Record<NonNullable<FiltersState['gender']>, string> = {
  Мужской: 'male',
  Женский: 'female',
}

const EDUCATION_LEVEL_TO_API: Record<string, string> = {
  Школьное: 'school',
  'Среднее специальное': 'secondary_special',
  Высшее: 'higher',
}

/** Преобразует состояние фильтров UI в параметры запроса поиска пользователей. */
export function mapFiltersToSearchRequest(state: FiltersState): SearchUsersRequest {
  const [ageMin, ageMax] = state.ageRange
  const params: SearchUsersRequest = {
    age_min: ageMin,
    age_max: ageMax,
  }

  if (state.gender != null) {
    params.gender = GENDER_TO_API[state.gender]
  }
  if (state.city.trim() !== '') {
    params.city = state.city.trim()
  }
  if (state.relationshipGoals.length > 0) {
    params.relationship_goal = state.relationshipGoals[0]
  }
  if (state.workFields.length > 0) {
    params.job_spheres = [...state.workFields]
  }
  if (state.educationLevel != null) {
    const educationCode = EDUCATION_LEVEL_TO_API[state.educationLevel] ?? state.educationLevel
    params.education_levels = [educationCode]
  }
  if (state.educationInstitution.trim() !== '') {
    params.education_details = state.educationInstitution.trim()
  }
  if (Object.keys(state.filters).length > 0) {
    params.filters = state.filters
  }
  const [weightAppearance, weightSocial, weightPersonality] = state.priorities
  params.weight_appearance = weightAppearance / 100
  params.weight_social = weightSocial / 100
  params.weight_personality = weightPersonality / 100

  if (state.premiumOnly) {
    params.only_premium = true
  }

  return params
}
