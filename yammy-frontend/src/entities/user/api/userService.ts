import { isOnboardingSession } from '@/entities/token/lib/isOnboardingSession'

import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'
import type { PaginatedResponse } from '@/shared/api/pagination'

import type {
  FiltersMetadataResponse,
  SearchUsersRequest,
  UserProfileDto,
  UserProfilePhotoDto,
  UserSearchApiUser,
  UserUpdateRequestDto,
} from '../types/types'

const SEARCH_ENDPOINT = 'api/v1/users/search'
const RECEIVED_LIKES_ENDPOINT = 'api/v1/users/likes'
const FILTERS_ENDPOINT = 'api/v1/filters/'
const PROFILE_ENDPOINT = 'api/v1/users/'
const USER_IMAGE_ENDPOINT = 'api/v1/users/image'
const USER_MAIN_IMAGE_ENDPOINT = 'api/v1/users/image/main'
const USER_BOOST_ACTIVATE_ENDPOINT = 'api/v1/users/boosts/activate'

const userImageOrderEndpoint = (imageId: string) => `${USER_IMAGE_ENDPOINT}/${imageId}/order`

export class UserService {
  public async getUsersSearch(body: SearchUsersRequest): Promise<UserSearchApiUser[]> {
    const response = await authApi.post(SEARCH_ENDPOINT, {
      json: body,
    })

    if (!response.ok) {
      await throwApiError(response, 'Ошибка поиска')
    }

    return response.json() as Promise<UserSearchApiUser[]>
  }

  public async getReceivedLikes(
    page: number,
    size: number,
  ): Promise<PaginatedResponse<UserSearchApiUser>> {
    const response = await authApi.get(RECEIVED_LIKES_ENDPOINT, {
      searchParams: { page, size },
    })
    if (!response.ok) {
      await throwApiError(response, 'Ошибка загрузки лайков')
    }
    return response.json() as Promise<PaginatedResponse<UserSearchApiUser>>
  }

  public async getFilters(): Promise<FiltersMetadataResponse> {
    const path = isOnboardingSession()
      ? 'api/v1/auth/onboarding/filters'
      : FILTERS_ENDPOINT
    const response = await authApi.get(path)

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

    const data = (await response.json()) as UserProfileDto
    return {
      ...data,
      filter_option_ids: data.filter_option_ids ?? [],
      referral_code: data.referral_code ?? '',
    }
  }

  public async updateUserProfile(body: UserUpdateRequestDto): Promise<void> {
    const response = await authApi.put(PROFILE_ENDPOINT, { json: body })
    if (!response.ok) {
      await throwApiError(response, 'Сохранение профиля')
    }
  }

  /** Доп. фото: модерация + сохранение (POST). */
  public async uploadUserGalleryPhoto(file: File): Promise<UserProfilePhotoDto> {
    const formData = new FormData()
    formData.append('image', file)
    const response = await authApi.post(USER_IMAGE_ENDPOINT, { body: formData })
    if (!response.ok) {
      await throwApiError(response, 'Загрузка фото')
    }
    return response.json() as Promise<UserProfilePhotoDto>
  }

  /** Существующее фото из галереи → главное (`existing_image_id` query → PATCH /image/main). */
  public async setMainFromGalleryPhoto(galleryPhotoId: string): Promise<UserProfilePhotoDto[]> {
    const response = await authApi.patch(USER_MAIN_IMAGE_ENDPOINT, {
      searchParams: { existing_image_id: galleryPhotoId },
    })
    if (!response.ok) {
      await throwApiError(response, 'Главное фото')
    }
    return response.json() as Promise<UserProfilePhotoDto[]>
  }

  /** Главное фото: модерация + подмена (multipart PATCH /image/main). */
  public async uploadUserMainPhoto(file: File): Promise<UserProfilePhotoDto> {
    const formData = new FormData()
    formData.append('image', file)
    const response = await authApi.patch(USER_MAIN_IMAGE_ENDPOINT, { body: formData })
    if (!response.ok) {
      await throwApiError(response, 'Главное фото')
    }
    return response.json() as Promise<UserProfilePhotoDto>
  }

  /** Полная смена порядка: те же записи профиля, новые поля order. */
  public async updateUserPhotosOrder(
    imageId: string,
    photos: { id: string; order: number }[],
  ): Promise<UserProfilePhotoDto[]> {
    const response = await authApi.patch(userImageOrderEndpoint(imageId), {
      json: { photos },
    })
    if (!response.ok) {
      await throwApiError(response, 'Порядок фото')
    }
    return response.json() as Promise<UserProfilePhotoDto[]>
  }

  public async deleteUserGalleryPhoto(imageId: string): Promise<void> {
    const response = await authApi.delete(USER_IMAGE_ENDPOINT, {
      searchParams: { image_id: imageId },
    })
    if (!response.ok) {
      await throwApiError(response, 'Удаление фото')
    }
  }

  public async activateBoost(): Promise<void> {
    const response = await authApi.post(USER_BOOST_ACTIVATE_ENDPOINT)
    if (!response.ok) {
      await throwApiError(response, 'Активация буста')
    }
  }
}

export const userService = new UserService()
export const {
  getUsersSearch,
  getReceivedLikes,
  getFilters,
  getUserProfile,
  updateUserProfile,
  uploadUserGalleryPhoto,
  uploadUserMainPhoto,
  setMainFromGalleryPhoto,
  updateUserPhotosOrder,
  deleteUserGalleryPhoto,
  activateBoost,
} = userService
