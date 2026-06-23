export function formatSubscriptionExpiresAt(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export const SUBSCRIPTION_PITCH =
  'Больше лайков, приоритет в ленте и расширенные фильтры — оформите подписку, чтобы находить людей быстрее!'

export const SUBSCRIPTION_STUB_TOAST_MESSAGE =
  'Пока доступен расширенный функционал без подписок!'
