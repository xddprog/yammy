import type { AiSearchJobStatus } from '@/entities/ai-search'

const STATUS_LABELS: Record<AiSearchJobStatus, string> = {
  queued: 'В очереди',
  parsing: 'Разбираем запрос',
  searching: 'Ищем анкеты',
  ready: 'Готово',
  failed: 'Ошибка',
  cancelled: 'Отменено',
}

export function formatJobStatus(status: AiSearchJobStatus): string {
  return STATUS_LABELS[status]
}

export function formatJobDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
