import type { QueryClient } from '@tanstack/react-query'

import type { UserProfileDto, UserProfilePhotoDto } from '../types/types'
import { usersQueryKeys } from './usersQueryKeys'

export function patchProfilePhotosInCache(queryClient: QueryClient, photos: UserProfilePhotoDto[]): void {
  queryClient.setQueryData<UserProfileDto>(usersQueryKeys.profile(), (prev) => {
    if (!prev) return prev
    const sorted = [...photos].sort((a, b) => a.order - b.order)
    return { ...prev, photos: sorted }
  })
}

export function mergeUploadedGalleryPhotoInCache(queryClient: QueryClient, photo: UserProfilePhotoDto): void {
  queryClient.setQueryData<UserProfileDto>(usersQueryKeys.profile(), (prev) => {
    if (!prev) return prev
    const without = prev.photos.filter((p) => p.id !== photo.id)
    const photos = [...without, photo].sort((a, b) => a.order - b.order)
    return { ...prev, photos }
  })
}

export function mergeUploadedMainPhotoInCache(queryClient: QueryClient, mainPhoto: UserProfilePhotoDto): void {
  queryClient.setQueryData<UserProfileDto>(usersQueryKeys.profile(), (prev) => {
    if (!prev) return prev
    const rest = prev.photos
      .filter((p) => p.id !== mainPhoto.id)
      .map((p) => ({ ...p, is_main: false }))
    const photos = [...rest, { ...mainPhoto, is_main: true }].sort((a, b) => a.order - b.order)
    return { ...prev, photos }
  })
}

export function removeProfilePhotoFromCache(queryClient: QueryClient, removedId: string): void {
  queryClient.setQueryData<UserProfileDto>(usersQueryKeys.profile(), (prev) => {
    if (!prev) return prev
    const photos = prev.photos
      .filter((p) => p.id !== removedId)
      .sort((a, b) => a.order - b.order)
      .map((p, index) => ({ ...p, order: index }))
    return { ...prev, photos }
  })
}
