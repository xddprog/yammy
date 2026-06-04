import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'

const MODERATE_TEXT = 'api/v1/auth/moderate/text'
const MODERATE_IMAGE = 'api/v1/auth/moderate/image'

export async function moderateText(text: string): Promise<void> {
  const response = await authApi.post(MODERATE_TEXT, { json: { text } })
  if (!response.ok) {
    await throwApiError(response, 'Проверка текста')
  }
}

export async function moderateImage(file: File, isMain: boolean): Promise<void> {
  const formData = new FormData()
  formData.append('image', file)
  const response = await authApi.post(MODERATE_IMAGE, {
    body: formData,
    searchParams: { is_main: isMain },
  })
  if (!response.ok) {
    await throwApiError(response, 'Проверка фото')
  }
}
