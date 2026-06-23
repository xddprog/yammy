const SAFE_FAILURE_MESSAGES = new Set([
  'Не удалось сделать расклад. Попробуйте позже.',
  'Сегодня вы уже сделали расклад. Вернитесь завтра.',
  'Расклад доступен только для ваших матчей.',
])

const DEFAULT_FAILURE_MESSAGE = 'Не удалось сделать расклад. Попробуйте позже.'

export function getTarotCompatibilityFailureMessage(raw: string | null | undefined): string {
  const trimmed = raw?.trim()
  if (trimmed && SAFE_FAILURE_MESSAGES.has(trimmed)) {
    return trimmed
  }
  return DEFAULT_FAILURE_MESSAGE
}

export const TAROT_QUOTA_MESSAGE = 'Сегодня вы уже сделали расклад. Вернитесь завтра.'
