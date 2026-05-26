import type { UserSearchApiUser } from '@/entities/user/types/types'

import type { ChatPeerDetailDto, ChatWsPeer } from '../types/chatSocket'

function normalizeEnum(value: unknown): string {
  if (value == null) return ''
  return String(value)
}

export function mapChatPeerDetailDto(dto: ChatPeerDetailDto): {
  profile: UserSearchApiUser
  header: ChatWsPeer
} {
  const userId =
    dto.user_id ?? (dto as ChatPeerDetailDto & { id?: string }).id ?? ''
  const photos = dto.photos?.length ? dto.photos : []
  const rawFilterIds = dto.filter_option_ids ?? []
  const filterOptionIds = (
    Array.isArray(rawFilterIds) ? rawFilterIds : []
  ).map((id) => String(id))

  const profile: UserSearchApiUser = {
    user_id: userId,
    username: dto.username ?? '',
    name: dto.name,
    age: dto.age,
    is_banned: Boolean(dto.is_banned),
    gender: normalizeEnum(dto.gender),
    relationship_goal: normalizeEnum(dto.relationship_goal),
    bio: dto.bio ?? '',
    city: dto.city ?? '',
    job: dto.job ?? '',
    job_sphere: normalizeEnum(dto.job_sphere),
    education_level: normalizeEnum(dto.education_level),
    education_details: dto.education_details ?? '',
    photos,
    filter_option_ids: filterOptionIds,
    match_percentage: dto.match_percentage ?? 0,
  }

  const header: ChatWsPeer = {
    id: userId,
    name: dto.name,
    age: dto.age,
    is_banned: Boolean(dto.is_banned),
    main_photo: photos[0] ?? '',
    last_seen: dto.last_seen,
  }

  return { profile, header }
}
