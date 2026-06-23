import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { fetchFilterCatalog } from '@/entities/admin-auth/api'
import { Card, Input } from '@/shared/ui/primitives'
import { cn } from '@/shared/lib/utils'
import { labelSubscriptionTier, t } from '@/shared/lib/labels'

export type UserSearchFiltersState = {
  q: string
  city: string
  gender: string
  ageMin: string
  ageMax: string
  relationshipGoal: string
  jobSphere: string
  educationLevel: string
  educationDetails: string
  subscriptionTier: string
  isBanned: string
  moderationApproved: string
  filterOptionIds: string[]
}

export const emptyUserSearchFilters: UserSearchFiltersState = {
  q: '',
  city: '',
  gender: '',
  ageMin: '',
  ageMax: '',
  relationshipGoal: '',
  jobSphere: '',
  educationLevel: '',
  educationDetails: '',
  subscriptionTier: '',
  isBanned: '',
  moderationApproved: '',
  filterOptionIds: [],
}

const selectClass =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500'

export function UsersSearchFilters({
  value,
  onChange,
}: {
  value: UserSearchFiltersState
  onChange: (next: UserSearchFiltersState) => void
}) {
  const [traitsOpen, setTraitsOpen] = useState(false)
  const { data: filterCatalog = [] } = useQuery({
    queryKey: ['admin-filter-catalog'],
    queryFn: fetchFilterCatalog,
  })

  function patch(partial: Partial<UserSearchFiltersState>) {
    onChange({ ...value, ...partial })
  }

  function toggleFilterOption(optionId: string) {
    const exists = value.filterOptionIds.includes(optionId)
    patch({
      filterOptionIds: exists
        ? value.filterOptionIds.filter((id) => id !== optionId)
        : [...value.filterOptionIds, optionId],
    })
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-medium">{t.userSearchFilters}</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Input
          value={value.q}
          onChange={(e) => patch({ q: e.target.value })}
          placeholder={t.searchUsersPlaceholder}
        />
        <Input
          value={value.city}
          onChange={(e) => patch({ city: e.target.value })}
          placeholder={t.filterCity}
        />
        <select className={selectClass} value={value.gender} onChange={(e) => patch({ gender: e.target.value })}>
          <option value="">{t.filterAnyGender}</option>
          <option value="male">{t.genderMale}</option>
          <option value="female">{t.genderFemale}</option>
        </select>
        <Input
          type="number"
          min={16}
          max={100}
          value={value.ageMin}
          onChange={(e) => patch({ ageMin: e.target.value })}
          placeholder={t.filterAgeMin}
        />
        <Input
          type="number"
          min={16}
          max={100}
          value={value.ageMax}
          onChange={(e) => patch({ ageMax: e.target.value })}
          placeholder={t.filterAgeMax}
        />
        <select
          className={selectClass}
          value={value.relationshipGoal}
          onChange={(e) => patch({ relationshipGoal: e.target.value })}
        >
          <option value="">{t.filterAnyGoal}</option>
          <option value="dating">{t.goalDating}</option>
          <option value="friendship">{t.goalFriendship}</option>
          <option value="communication">{t.goalCommunication}</option>
          <option value="relationship">{t.goalRelationship}</option>
          <option value="fwb">{t.goalFwb}</option>
          <option value="ons">{t.goalOns}</option>
          <option value="party">{t.goalParty}</option>
        </select>
        <select
          className={selectClass}
          value={value.jobSphere}
          onChange={(e) => patch({ jobSphere: e.target.value })}
        >
          <option value="">{t.filterAnyJobSphere}</option>
          <option value="it">IT</option>
          <option value="design">{t.jobDesign}</option>
          <option value="finance">{t.jobFinance}</option>
          <option value="medicine">{t.jobMedicine}</option>
          <option value="education">{t.jobEducation}</option>
          <option value="other">{t.jobOther}</option>
        </select>
        <select
          className={selectClass}
          value={value.educationLevel}
          onChange={(e) => patch({ educationLevel: e.target.value })}
        >
          <option value="">{t.filterAnyEducation}</option>
          <option value="school">{t.educationSchool}</option>
          <option value="college">{t.educationCollege}</option>
          <option value="higher">{t.educationHigher}</option>
        </select>
        <Input
          value={value.educationDetails}
          onChange={(e) => patch({ educationDetails: e.target.value })}
          placeholder={t.filterEducationDetails}
        />
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          {t.subscription}
          <select
            className={selectClass}
            value={value.subscriptionTier}
            onChange={(e) => patch({ subscriptionTier: e.target.value })}
          >
            <option value="">{t.filterAnySubscription}</option>
            <option value="free">{labelSubscriptionTier('free')}</option>
            <option value="vip">{labelSubscriptionTier('vip')}</option>
            <option value="premium">{labelSubscriptionTier('premium')}</option>
          </select>
        </label>
        <select
          className={selectClass}
          value={value.isBanned}
          onChange={(e) => patch({ isBanned: e.target.value })}
        >
          <option value="">{t.filterAnyBanStatus}</option>
          <option value="false">{t.filterNotBanned}</option>
          <option value="true">{t.filterBannedOnly}</option>
        </select>
        <select
          className={selectClass}
          value={value.moderationApproved}
          onChange={(e) => patch({ moderationApproved: e.target.value })}
        >
          <option value="">{t.filterAnyModeration}</option>
          <option value="true">{t.filterModerationApproved}</option>
          <option value="false">{t.filterModerationPending}</option>
        </select>
      </div>
      {filterCatalog.length > 0 && (
        <div className="border-t border-zinc-800 pt-4">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
            onClick={() => setTraitsOpen((open) => !open)}
          >
            <span className="text-sm font-medium text-zinc-300">
              {t.profileCharacteristics}
              {value.filterOptionIds.length > 0 && (
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  ({value.filterOptionIds.length})
                </span>
              )}
            </span>
            <ChevronDown
              className={cn('size-4 shrink-0 text-zinc-500 transition', traitsOpen && 'rotate-180')}
            />
          </button>
          {traitsOpen && (
            <div className="mt-3 space-y-3">
              {filterCatalog.map((category) => (
                <div key={category.id}>
                  <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">{category.name}</div>
                  <div className="space-y-3">
                    {category.subcategories.map((sub) => (
                      <div key={sub.id}>
                        <div className="mb-1 text-sm text-zinc-400">{sub.name}</div>
                        <div className="flex flex-wrap gap-2">
                          {sub.options.map((option) => {
                            const checked = value.filterOptionIds.includes(option.id)
                            return (
                              <label
                                key={option.id}
                                className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition ${
                                  checked
                                    ? 'border-white bg-white text-zinc-900'
                                    : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  onChange={() => toggleFilterOption(option.id)}
                                />
                                {option.name}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export function buildUserSearchParams(
  filters: UserSearchFiltersState,
  page = 1,
  size = 20,
): Record<string, string | number | boolean | string[] | undefined> {
  const params: Record<string, string | number | boolean | string[] | undefined> = { page, size }
  if (filters.q.trim()) params.q = filters.q.trim()
  if (filters.city.trim()) params.city = filters.city.trim()
  if (filters.gender) params.gender = filters.gender
  if (filters.ageMin) params.age_min = Number(filters.ageMin)
  if (filters.ageMax) params.age_max = Number(filters.ageMax)
  if (filters.relationshipGoal) params.relationship_goal = filters.relationshipGoal
  if (filters.jobSphere) params.job_sphere = [filters.jobSphere]
  if (filters.educationLevel) params.education_level = [filters.educationLevel]
  if (filters.educationDetails.trim()) params.education_details = filters.educationDetails.trim()
  if (filters.subscriptionTier) params.subscription_tier = filters.subscriptionTier
  if (filters.isBanned !== '') params.is_banned = filters.isBanned === 'true'
  if (filters.moderationApproved !== '') {
    params.profile_moderation_approved = filters.moderationApproved === 'true'
  }
  if (filters.filterOptionIds.length > 0) params.filter_option_ids = filters.filterOptionIds
  return params
}
