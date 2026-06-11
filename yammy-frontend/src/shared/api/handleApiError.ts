import type { ApiErrorResponse } from './types'
import { parseErrorDetail } from '@/shared/lib/parseErrorDetail'
import {
  formatUserErrorMessage,
  USER_ERROR_CONNECTION_LOST,
  USER_ERROR_INTERNAL_SERVER,
} from '@/shared/lib/formatUserErrorMessage'
import { showErrorToast } from '@/shared/ui/error-toast/errorToastBus'

export async function throwApiError(response: Response, _fallbackPrefix: string): Promise<never> {
  if (response.status === 401) {
    throw new Error('UNAUTHORIZED')
  }

  if (response.status === 500) {
    showErrorToast(USER_ERROR_INTERNAL_SERVER)
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
  const userMessage = formatUserErrorMessage(
    finalMessage.length > 0 ? new Error(finalMessage) : USER_ERROR_CONNECTION_LOST,
  )
  showErrorToast(userMessage)
  throw new Error(userMessage)
}
