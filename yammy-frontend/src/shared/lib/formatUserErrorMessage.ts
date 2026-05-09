export const USER_ERROR_CONNECTION_LOST = 'Соединение потеряно'

export const USER_ERROR_INTERNAL_SERVER = 'Внутренняя ошибка сервера'

export function formatUserErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    const t = error.trim()
    return t.length > 0 ? t : USER_ERROR_CONNECTION_LOST
  }
  if (isHttpErrorWithStatus(error, 500)) {
    return USER_ERROR_INTERNAL_SERVER
  }
  if (!(error instanceof Error)) {
    return USER_ERROR_CONNECTION_LOST
  }
  const t = error.message?.trim() ?? ''
  if (t.length === 0) {
    return USER_ERROR_CONNECTION_LOST
  }
  const lower = t.toLowerCase()
  if (
    error.name === 'TypeError' &&
    (lower.includes('failed to fetch') || lower.includes('load failed') || lower.includes('network'))
  ) {
    return USER_ERROR_CONNECTION_LOST
  }
  if (/\b500\b/.test(t) && (lower.includes('status') || lower.includes('request failed'))) {
    return USER_ERROR_INTERNAL_SERVER
  }
  return t
}

function isHttpErrorWithStatus(error: unknown, status: number): boolean {
  if (error == null || typeof error !== 'object') return false
  const err = error as { response?: { status?: number } }
  return typeof err.response?.status === 'number' && err.response.status === status
}
