import type { UserFilters } from '@/entities/user/types/types'

import type { GenderOption } from '../lib/constants'
import { AGE_DEFAULT_MAX, AGE_DEFAULT_MIN } from '../lib/constants'
import type { EducationLevel } from './educationLevel'

/** Состояние фильтров для UI и последующей отправки на бэкенд */
export interface FiltersState {
  /** Пол */
  gender: GenderOption | null
  /** Диапазон возраста [от, до] */
  ageRange: [number, number]
  /** Город (название или id — уточнить при интеграции с API) */
  city: string
  /** О себе (`users.bio`). */
  bio: string
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
  /** Только премиум-анкеты */
  premiumOnly: boolean
}

/** Начальное состояние фильтров (для сброса и по умолчанию) */
export const getDefaultFiltersState = (): FiltersState => ({
  gender: 'Женский', // дефолтный пол на время
  ageRange: [AGE_DEFAULT_MIN, AGE_DEFAULT_MAX],
  city: '',
  bio: '',
  filters: {},
  relationshipGoals: [],
  workFields: [],
  job: '',
  educationLevel: null,
  educationInstitution: '',
  priorities: [50, 50, 50],
  premiumOnly: false,
})
