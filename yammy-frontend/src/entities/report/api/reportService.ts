import { authApi } from '@/shared/api/baseQueryInstanse'
import { throwApiError } from '@/shared/api/handleApiError'

const REPORTS_BASE = 'api/v1/reports'

export async function sendUserReport(params: {
  reportedId: string
  reason: string
  comment?: string
}): Promise<void> {
  const response = await authApi.post(`${REPORTS_BASE}/`, {
    json: {
      reported_id: params.reportedId,
      reason: params.reason,
      comment: params.comment,
    },
  })

  if (!response.ok) {
    await throwApiError(response, 'Жалоба')
  }
}

