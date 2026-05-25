export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  size: number
}

export const DEFAULT_PAGE_SIZE = 20

export function getNextPageParam<T>(page: PaginatedResponse<T>): number | undefined {
  if (page.page * page.size >= page.total) {
    return undefined
  }
  return page.page + 1
}
