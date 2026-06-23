import type { UserFilters } from '@/entities/user/types/types'

import type { GenderOption } from '../lib/constants'
import { AGE_ABSOLUTE_MAX, AGE_ABSOLUTE_MIN } from '../lib/constants'
import type { EducationLevel } from './educationLevel'

/** Состояние фильтров для UI и последующей отправки на бэкенд */
export interface FiltersState {
  /** Пол */
  gender: GenderOption | null
  /** Диапазон возраста [от, до] */
  ageRange: [number, number]
  /** Город (название или id — уточнить при интеграции с API) */
  city: string
  /** О себе в профиле (`users.bio`). */
  bio: string
  /** Семантический поиск по описанию в ленте (`search_text` в API). */
  searchText: string
  /** Динамические фильтры по категориям/подкатегориям (из метаданных бэка) */
  filters: UserFilters
  /** Цели отношений (множественный выбор) */
  relationshipGoals: string[]
  /** Сфера работы (множественный выбор) */
  workFields: string[]
  /** Должность / место работы (`users.job` на бэкенде; вместе с `job_sphere`). */
  job: string
  /** Уровень образования (`EducationLevelEnum` бэкенда). */
  educationLevel: EducationLevel | null
  /** Учебное заведение (название ВУЗа, хранится в users.education_details) */
  educationInstitution: string
  priorities: [number, number, number]
}

/** Начальное состояние фильтров ленты (для сброса и по умолчанию). */
export const getDefaultFiltersState = (searchGender: GenderOption | null = null): FiltersState => ({
  gender: searchGender,
  ageRange: [AGE_ABSOLUTE_MIN, AGE_ABSOLUTE_MAX],
  city: '',
  bio: '',
  searchText: '',
  filters: {},
  relationshipGoals: [],
  workFields: [],
  job: '',
  educationLevel: null,
  educationInstitution: '',
  priorities: [50, 50, 50],
})
