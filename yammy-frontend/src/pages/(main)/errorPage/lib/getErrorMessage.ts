import { isRouteErrorResponse } from 'react-router-dom'

function getMessageFromData(data: unknown): string | null {
  if (data !== null && typeof data === 'object' && 'message' in data) {
    const msg = (data as { message: unknown }).message
    if (typeof msg === 'string') return msg
  }
  return null
}

export function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return getMessageFromData(error.data) ?? error.statusText ?? 'Request failed'
  }
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error'
}
