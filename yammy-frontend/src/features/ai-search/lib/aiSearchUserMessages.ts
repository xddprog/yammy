const SAFE_FAILURE_MESSAGES = new Set([
  'Не удалось выполнить поиск. Попробуйте позже.',
  'Не удалось подобрать анкеты по запросу',
])

const DEFAULT_FAILURE_MESSAGE = 'Не удалось выполнить поиск. Попробуйте позже.'

export function getAiSearchFailureMessage(raw: string | null | undefined): string {
  const trimmed = raw?.trim()
  if (trimmed && SAFE_FAILURE_MESSAGES.has(trimmed)) {
    return trimmed
  }
  return DEFAULT_FAILURE_MESSAGE
}
