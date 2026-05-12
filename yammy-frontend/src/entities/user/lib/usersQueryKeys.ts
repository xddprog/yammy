import type { SearchUsersRequest } from '../types/types'

const USERS_ROOT = ['users'] as const

export const usersQueryKeys = {
  all: USERS_ROOT,
  search: (params: SearchUsersRequest) => [...USERS_ROOT, 'search', params] as const,
  receivedLikes: () => [...USERS_ROOT, 'received-likes'] as const,
  appearanceRating: () => [...USERS_ROOT, 'appearance-rating'] as const,
  filters: () => [...USERS_ROOT, 'filters'] as const,
  profile: () => [...USERS_ROOT, 'profile'] as const,
} as const
