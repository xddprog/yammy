export const AVATAR_URL = '/images/photo_2025-12-23_22-41-09.jpg'

/** Mock: заполненность профиля 0–100 (кольцо вокруг аватарки, как % мэтча в ленте). */
export const PROFILE_COMPLETENESS_PERCENT_MOCK = 78

export const PROFILE_PHOTOS = [
  '/images/photo_2025-12-23_22-41-09.jpg',
  '/images/photo_2025-12-16_22-32-35.jpg',
] as const

export const MAX_PROFILE_PHOTOS = 5

export const RELATIONSHIP_GOAL_OPTIONS = [
  { label: 'Серьезные отношения', value: 'serious' },
  { label: 'Знакомства', value: 'dating' },
  { label: 'Дружба', value: 'friendship' },
] as const

export const WORK_SPHERE_MOCK_OPTIONS = [
  { label: 'IT', value: 'it' },
  { label: 'Дизайн', value: 'design' },
  { label: 'Маркетинг', value: 'marketing' },
  { label: 'Финансы', value: 'finance' },
  { label: 'Образование', value: 'education' },
] as const

export const EDUCATION_LEVEL_OPTIONS = [
  { label: 'Школьное', value: 'school' },
  { label: 'Среднее специальное', value: 'secondary_special' },
  { label: 'Высшее', value: 'higher' },
] as const

