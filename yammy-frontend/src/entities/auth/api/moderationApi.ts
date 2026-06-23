import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'
import { compressImageForUpload } from '@/shared/lib/compressImageForUpload'

const MODERATE_TEXT = 'api/v1/auth/moderate/text'
const MODERATE_IMAGE = 'api/v1/auth/moderate/image'
/** CLIP + face detection на CPU; первый запрос после старта API может быть долгим. */
const MODERATION_REQUEST_TIMEOUT_MS = 180_000

export async function moderateText(text: string): Promise<void> {
  const response = await authApi.post(MODERATE_TEXT, { json: { text } })
  if (!response.ok) {
    await throwApiError(response, 'Проверка текста')
  }
}

export async function moderateImage(file: File, isMain: boolean): Promise<File> {
  const prepared = await compressImageForUpload(file)
  const formData = new FormData()
  formData.append('image', prepared)
  const response = await authApi.post(MODERATE_IMAGE, {
    body: formData,
    searchParams: { is_main: isMain },
    timeout: MODERATION_REQUEST_TIMEOUT_MS,
  })
  if (!response.ok) {
    await throwApiError(response, 'Проверка фото')
  }
  return prepared
}
