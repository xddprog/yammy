import type { ApiErrorResponse } from '@/shared/api/types'

export function parseErrorDetail(detail: ApiErrorResponse['detail']): string {
  if (typeof detail === 'string') return detail
  return detail.map((d) => `${d.loc.join('.')}: ${d.msg}`).join('; ')
}
