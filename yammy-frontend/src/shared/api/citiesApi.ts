import { authApi } from './baseQueryInstanse'
import { throwApiError } from './handleApiError'

export async function fetchCityNames(q: string, limit: number): Promise<string[]> {
  const response = await authApi.get('api/v1/cities', {
    searchParams: { q, limit: String(limit) },
  })

  if (!response.ok) {
    await throwApiError(response, 'Города')
  }

  const data = (await response.json()) as unknown
  return Array.isArray(data) ? (data as string[]) : []
}
