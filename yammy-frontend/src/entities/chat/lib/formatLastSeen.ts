export function formatLastSeenLabel(lastSeen: string | null | undefined): string {
  if (!lastSeen) {
    return 'не в сети'
  }

  const date = new Date(lastSeen)
  if (Number.isNaN(date.getTime())) {
    return 'не в сети'
  }

  const now = new Date()
  const diffMs = Math.max(0, now.getTime() - date.getTime())
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes < 1) {
    return 'был(а) только что'
  }

  if (diffMinutes < 60) {
    return `был(а) ${diffMinutes} мин назад`
  }

  const time = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const isSameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()

  if (isSameDay) {
    return `был(а) сегодня в ${time}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  const isYesterday =
    yesterday.getFullYear() === date.getFullYear() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getDate() === date.getDate()

  if (isYesterday) {
    return `был(а) вчера в ${time}`
  }

  const formattedDate = date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  })

  return `был(а) ${formattedDate} в ${time}`
}
