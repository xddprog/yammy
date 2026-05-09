import { authApi, publicApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'

import type {
  FiltersMetadataResponse,
  SearchUsersRequest,
  UserProfileDto,
  UserSearchResult,
} from '../types/types'

const SEARCH_ENDPOINT = 'api/v1/users/search'
const FILTERS_ENDPOINT = 'admin/filters/'
const PROFILE_ENDPOINT = 'api/v1/users/'

export class UserService {
  public async getUsersSearch(body: SearchUsersRequest): Promise<UserSearchResult[]> {
    const response = await authApi.post(SEARCH_ENDPOINT, {
      json: body,
    })

    if (!response.ok) {
      await throwApiError(response, 'Ошибка поиска')
    }

    return response.json() as Promise<UserSearchResult[]>
  }

  public async getFilters(): Promise<FiltersMetadataResponse> {
    const response = await publicApi.get(FILTERS_ENDPOINT)

    if (!response.ok) {
      await throwApiError(response, 'Ошибка загрузки фильтров')
    }

    return response.json() as Promise<FiltersMetadataResponse>
  }
  public async getUserProfile(): Promise<UserProfileDto> {
    const response = await authApi.get(PROFILE_ENDPOINT)

    if (!response.ok) {
      await throwApiError(response, 'Ошибка загрузки профиля')
    }

    return response.json() as Promise<UserProfileDto>
  }
}

export const userService = new UserService()
export const { getUsersSearch, getFilters, getUserProfile } = userService
