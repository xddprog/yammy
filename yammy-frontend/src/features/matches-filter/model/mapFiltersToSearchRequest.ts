import { WORK_SPHERE_OPTIONS } from '@/entities/user/constants/profileFieldOptions'
import type { SearchUsersRequest } from '@/entities/user/types/types'

import type { FiltersState } from './types'

const WORK_SPHERE_VALUES = new Set<string>(WORK_SPHERE_OPTIONS.map((option) => option.value))

const GENDER_TO_API: Record<NonNullable<FiltersState['gender']>, string> = {
  Мужской: 'male',
  Женский: 'female',
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
  const jobSpheres = state.workFields.filter((value) => WORK_SPHERE_VALUES.has(value))
  if (jobSpheres.length > 0) {
    params.job_spheres = jobSpheres
  }
  if (state.educationLevel != null) {
    params.education_levels = [state.educationLevel]
  }
  if (state.educationInstitution.trim() !== '') {
    params.education_details = state.educationInstitution.trim()
  }
  if (state.searchText.trim() !== '') {
    params.search_text = state.searchText.trim()
  }
  if (Object.keys(state.filters).length > 0) {
    params.filters = state.filters
  }
  const [weightAppearance, weightSocial, weightPersonality] = state.priorities
  params.weight_appearance = weightAppearance / 100
  params.weight_social = weightSocial / 100
  params.weight_personality = weightPersonality / 100

  return params
}
