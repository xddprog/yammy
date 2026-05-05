import type { ApiErrorResponse } from './types'
import { parseErrorDetail } from '@/shared/lib/parseErrorDetail'

/**
 * Парсит тело ответа и выбрасывает Error с сообщением из API или fallback.
 */
export async function throwApiError(response: Response, fallbackPrefix: string): Promise<never> {
  let message = `${fallbackPrefix}: ${response.status} ${response.statusText}`

  const text = await response.text()
  if (text) {
    try {
      const errorJson = JSON.parse(text) as ApiErrorResponse
      if (errorJson.detail) {
        message = parseErrorDetail(errorJson.detail)
      }
    } catch {
      message = text
    }
  }

  throw new Error(message)
}
