const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

export function formatChatListTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const now = new Date()
  if (isSameDay(date, now)) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(date, yesterday)) {
    return 'Вчера'
  }

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)
  if (date >= weekStart) {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' })
  }

  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}
