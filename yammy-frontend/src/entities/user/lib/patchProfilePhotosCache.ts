import type { QueryClient } from '@tanstack/react-query'

import type { UserProfileDto, UserProfilePhotoDto } from '../types/types'
import { usersQueryKeys } from './usersQueryKeys'

function applyPhotoPatch(prev: UserProfileDto, photos: UserProfilePhotoDto[]): UserProfileDto {
  const sorted = [...photos].sort((a, b) => a.order - b.order)
  if (prev.profile_moderation_status !== 'rejected') {
    return { ...prev, photos: sorted }
  }
  return {
    ...prev,
    photos: sorted,
    profile_moderation_status: 'pending',
    profile_moderation_note: null,
  }
}

export function patchProfilePhotosInCache(queryClient: QueryClient, photos: UserProfilePhotoDto[]): void {
  queryClient.setQueryData<UserProfileDto>(usersQueryKeys.profile(), (prev) => {
    if (!prev) return prev
    return applyPhotoPatch(prev, photos)
  })
}

export function mergeUploadedGalleryPhotoInCache(queryClient: QueryClient, photo: UserProfilePhotoDto): void {
  queryClient.setQueryData<UserProfileDto>(usersQueryKeys.profile(), (prev) => {
    if (!prev) return prev
    const without = prev.photos.filter((p) => p.id !== photo.id)
    return applyPhotoPatch(prev, [...without, photo])
  })
}

export function mergeUploadedMainPhotoInCache(queryClient: QueryClient, mainPhoto: UserProfilePhotoDto): void {
  queryClient.setQueryData<UserProfileDto>(usersQueryKeys.profile(), (prev) => {
    if (!prev) return prev
    const rest = prev.photos
      .filter((p) => p.id !== mainPhoto.id)
      .map((p) => ({ ...p, is_main: false }))
    return applyPhotoPatch(prev, [...rest, { ...mainPhoto, is_main: true }])
  })
}

export function removeProfilePhotoFromCache(queryClient: QueryClient, removedId: string): void {
  queryClient.setQueryData<UserProfileDto>(usersQueryKeys.profile(), (prev) => {
    if (!prev) return prev
    const photos = prev.photos
      .filter((p) => p.id !== removedId)
      .sort((a, b) => a.order - b.order)
      .map((p, index) => ({ ...p, order: index }))
    return applyPhotoPatch(prev, photos)
  })
}
