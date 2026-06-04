import type { UserProfileDto } from '@/entities/user/types/types'

/** Меньше этого числа выбранных интересов — считаем профиль слабо заполненным. */
const MIN_INTEREST_OPTIONS = 3

export function isProfileThinlyFilled(profile: UserProfileDto): boolean {
  return (profile.filter_option_ids?.length ?? 0) < MIN_INTEREST_OPTIONS
}
