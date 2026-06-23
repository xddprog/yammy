import type { GenderOption } from './constants'

/** Пол для поиска в ленте — противоположный полу пользователя. */
export function getOppositeSearchGender(profileGender: string): GenderOption | null {
  if (profileGender === 'male') return 'Женский'
  if (profileGender === 'female') return 'Мужской'
  return null
}
