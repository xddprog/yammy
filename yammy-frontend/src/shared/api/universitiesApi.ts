import { authApi } from './baseQueryInstanse'
import { throwApiError } from './handleApiError'

export async function fetchUniversityNames(q: string, limit: number): Promise<string[]> {
  const response = await authApi.get('api/v1/universities', {
    searchParams: { q, limit: String(limit) },
  })

  if (!response.ok) {
    await throwApiError(response, 'Вузы')
  }

  const data = (await response.json()) as unknown
  return Array.isArray(data) ? (data as string[]) : []
}
