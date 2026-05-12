import type {
  FilterCategoryDto,
  UserFilters,
  UserProfileDto,
  UserUpdateRequestDto,
} from '@/entities/user/types/types'
import type { FiltersState } from '@/features/matches-filter/model/types'

const GENDER_TO_API: Record<NonNullable<FiltersState['gender']>, 'male' | 'female'> = {
  Мужской: 'male',
  Женский: 'female',
}

const GENDER_FROM_API: Record<string, NonNullable<FiltersState['gender']>> = {
  male: 'Мужской',
  female: 'Женский',
}

/** UUID опций из GET профиля → структура slug как в UI (нужны метаданные admin/filters). */
export function filterOptionIdsToUserFilters(
  ids: string[],
  metadata: FilterCategoryDto[] | undefined,
): UserFilters {
  if (!metadata?.length || !ids.length) {
    return {}
  }
  const idSet = new Set(ids)
  const out: UserFilters = {}
  for (const cat of metadata) {
    for (const sub of cat.subcategories) {
      const slugs: string[] = []
      for (const opt of sub.options) {
        if (idSet.has(opt.id)) {
          slugs.push(opt.slug)
        }
      }
      if (slugs.length > 0) {
        if (!out[cat.slug]) {
          out[cat.slug] = {}
        }
        out[cat.slug][sub.slug] = slugs
      }
    }
  }
  return out
}

export function collectFilterOptionIds(
  filters: UserFilters,
  metadata: FilterCategoryDto[],
): string[] {
  const ids: string[] = []
  for (const cat of metadata) {
    const subMap = filters[cat.slug]
    if (!subMap) continue
    for (const sub of cat.subcategories) {
      const slugs = subMap[sub.slug]
      if (!slugs?.length) continue
      for (const optSlug of slugs) {
        const opt = sub.options.find((o) => o.slug === optSlug)
        if (opt) ids.push(opt.id)
      }
    }
  }
  return Array.from(new Set(ids))
}

export function buildProfileUpdateBody(
  draft: FiltersState,
  metadata: FilterCategoryDto[],
): UserUpdateRequestDto {
  const filters = collectFilterOptionIds(draft.filters, metadata)
  const age = Math.round((draft.ageRange[0] + draft.ageRange[1]) / 2)

  const body: UserUpdateRequestDto = {
    age,
    filters,
  }

  if (draft.gender) {
    body.gender = GENDER_TO_API[draft.gender]
  }
  const city = draft.city.trim()
  if (city) {
    body.city = city
  }
  if (draft.relationshipGoals[0]) {
    body.relationship_goal = draft.relationshipGoals[0]
  }
  if (draft.workFields[0]) {
    body.job_sphere = draft.workFields[0]
    body.job = draft.job.trim() || ''
  }
  if (draft.educationLevel) {
    body.education_level = draft.educationLevel
  }
  if (draft.educationLevel === 'higher') {
    const details = draft.educationInstitution.trim()
    if (details) {
      body.education_details = details
    }
  }

  return body
}

export function userProfileToFiltersState(
  profile: UserProfileDto,
  base: FiltersState,
  filtersMetadata?: FilterCategoryDto[],
): FiltersState {
  const gender = GENDER_FROM_API[profile.gender] ?? null
  const filters = filterOptionIdsToUserFilters(profile.filter_option_ids ?? [], filtersMetadata)
  return {
    ...base,
    gender,
    ageRange: [profile.age, profile.age],
    city: profile.city ?? '',
    filters,
    relationshipGoals: profile.relationship_goal ? [profile.relationship_goal] : [],
    workFields: profile.job_sphere ? [profile.job_sphere] : [],
    job: profile.job?.trim() ?? '',
    educationLevel: profile.education_level as FiltersState['educationLevel'],
    educationInstitution: profile.education_details ?? '',
  }
}
