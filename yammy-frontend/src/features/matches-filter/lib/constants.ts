/** Опции фильтра «Пол» */
export const GENDER_OPTIONS = ['Мужской', 'Женский'] as const

/** Метки слайдеров приоритетов */
export const PRIORITY_LABELS = [
  'Важность внешности',
  'Важность социума',
  'Важность личности',
] as const

import { USER_AGE_MAX, USER_AGE_MIN } from '@/shared/lib/userAgeLimits'

/** Диапазон возраста: минимум и максимум по умолчанию */
export const AGE_DEFAULT_MIN = 16
export const AGE_DEFAULT_MAX = 30
export const AGE_ABSOLUTE_MIN = USER_AGE_MIN
export const AGE_ABSOLUTE_MAX = USER_AGE_MAX

/** Плейсхолдер поля «Город» */
export const CITY_PLACEHOLDER = 'Москва'

/** Плейсхолдер поля «Учебное заведение» */
export const EDUCATION_INSTITUTION_PLACEHOLDER = 'Учебное заведение'

export type GenderOption = (typeof GENDER_OPTIONS)[number]
