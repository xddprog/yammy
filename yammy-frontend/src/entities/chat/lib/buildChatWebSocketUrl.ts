import { getAccessToken } from '@/entities'
import { getWebSocketBaseUrl } from '@/shared/config/apiBaseUrl'

export function buildChatWebSocketUrl(matchId: string): string | null {
  const token = getAccessToken()
  if (!token) {
    return null
  }

  const url = new URL(`${getWebSocketBaseUrl()}/api/v1/chats/${matchId}`)
  url.searchParams.set('access_token', token)
  return url.toString()
}
