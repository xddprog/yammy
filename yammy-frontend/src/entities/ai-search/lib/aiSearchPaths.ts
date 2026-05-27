import { ERouteNames } from '@/shared/lib/routeVariables'

export function aiSearchResultsPath(jobId: string): string {
  return `/${ERouteNames.AI_SEARCH_ROUTE}/${jobId}/results`
}
