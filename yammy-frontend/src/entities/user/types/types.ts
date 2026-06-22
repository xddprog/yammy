export type UserFilters = Record<string, Record<string, string[]>>

export type SearchFilters = UserFilters

export interface SearchUsersRequest {
  age_max?: number
  age_min?: number
  city?: string
  education_levels?: string[]
  education_details?: string
  filters?: SearchFilters
  gender?: string
  job_spheres?: string[]
  only_online?: boolean
  only_premium?: boolean
  relationship_goal?: string
  search_text?: string
  show_seen?: boolean
  weight_appearance?: number
  weight_personality?: number
  weight_social?: number
}

export interface FilterOptionDto {
  id: string
  slug: string
  name: string
}

export interface FilterSubcategoryDto {
  id: string
  slug: string
  name: string
  options: FilterOptionDto[]
}

export interface FilterCategoryDto {
  id: string
  slug: string
  name: string
  subcategories: FilterSubcategoryDto[]
}

export type FiltersMetadataResponse = FilterCategoryDto[]

export type UserLanguage = 'ru' | 'en'

export interface UserProfilePhotoDto {
  id: string
  file_path: string
  order: number
  is_main: boolean
}

/** Локально: превью только на время загрузки. */
export type ProfilePhotoItem = UserProfilePhotoDto & {
  uploadStatus?: 'uploading'
}

export interface UserSearchApiUser {
  user_id: string
  username: string
  name: string
  age: number
  is_banned?: boolean
  gender: string
  relationship_goal: string
  bio: string
  city: string
  job: string
  job_sphere: string
  education_level: string
  education_details: string
  photos: string[]
  filter_option_ids: string[]
  match_percentage: number
  like_type?: 'like' | 'superlike' | null
  like_message?: string | null
}

export interface FeedStackCardUser {
  user_id: string
  name: string
  age: number
  city: string
  photos: string[]
}

/** Очередь GET appearance rating — тот же контракт, что минимальная карточка. */
export type AppearanceRatingUserDto = FeedStackCardUser

export interface AppearanceRatingReceivedItem extends UserSearchApiUser {
  score: number
  my_score: number | null
  is_mutual: boolean
}

/** Ответ GET /api/v1/users/ (свой профиль). */
export interface UserProfileDto {
  name: string
  age: number
  gender: string
  relationship_goal: string
  bio: string | null
  city: string | null
  job: string | null
  job_sphere: string | null
  education_level: string | null
  education_details: string | null
  subscription_tier: string
  subscription_expires_at: string | null
  has_active_subscription: boolean
  boost_expires_at: string | null
  last_seen: string
  is_banned: boolean
  superlikes_balance: number
  boosts_balance: number
  notifications_enabled: boolean
  language: UserLanguage
  photos: UserProfilePhotoDto[]
  adequacy_score: number
  referrals_count: number
  received_likes_count: number
  sent_likes_count: number
  matches_count: number
  profile_views_count: number
  received_appearance_ratings_count: number
  appearance_rating_average: number | null
  /** Реферальная ссылка (Telegram deep link); ключ API — `referral_code`. */
  referral_code: string
  /** UUID выбранных `FilterOption` (как в PUT `filters`). */
  filter_option_ids: string[]
}

/** Тело PUT /api/v1/users/ (все поля опциональны). */
export interface UserUpdateRequestDto {
  name?: string
  age?: number
  gender?: string
  relationship_goal?: string
  bio?: string
  city?: string
  job?: string
  job_sphere?: string
  education_level?: string
  education_details?: string
  filters?: string[]
  notifications_enabled?: boolean
  language?: UserLanguage
}
