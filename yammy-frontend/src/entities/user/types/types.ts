export type UserFilters = Record<string, Record<string, string[]>>

export type SearchFilters = UserFilters

export interface SearchUsersRequest {
  age_max?: number
  age_min?: number
  city?: string
  education_levels?: string[]
  education_query?: string
  filters?: SearchFilters
  gender?: string
  job_spheres?: string[]
  only_online?: boolean
  only_premium?: boolean
  relationship_goal?: string
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

export interface UserSearchResult {
  user_id: string
  username: string
  name: string
  age: number
  gender: string
  relationship_goal: string
  bio: string
  city: string
  job: string
  job_sphere: string
  education_level: string
  education_details: string
  photos: string[]
  filters: UserFilters
  subscription_tier: string
  boost_expires_at: string | null
  last_seen: string | null
  is_banned: boolean
  adequacy_score: number
  match_percentage: number
}
