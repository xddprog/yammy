import type { ApiErrorResponse } from './types'
import { parseErrorDetail } from '@/shared/lib/parseErrorDetail'
import {
  USER_ERROR_CONNECTION_LOST,
  USER_ERROR_INTERNAL_SERVER,
} from '@/shared/lib/formatUserErrorMessage'

export async function throwApiError(response: Response, _fallbackPrefix: string): Promise<never> {
  if (response.status === 500) {
    throw new Error(USER_ERROR_INTERNAL_SERVER)
  }

  let message: string | null = null

  const text = await response.text()
  if (text?.trim()) {
    try {
      const errorJson = JSON.parse(text) as ApiErrorResponse
      if (errorJson.detail !== undefined && errorJson.detail !== null && errorJson.detail !== '') {
        const parsed = parseErrorDetail(errorJson.detail).trim()
        if (parsed.length > 0) {
          message = parsed
        }
      }
    } catch {
      const trimmed = text.trim()
      if (trimmed.length > 0) {
        message = trimmed
      }
    }
  }

  const finalMessage = message?.trim() ?? ''
  throw new Error(finalMessage.length > 0 ? finalMessage : USER_ERROR_CONNECTION_LOST)
}
