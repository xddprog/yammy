export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const NGROK_SKIP_BROWSER_WARNING_HEADER = 'ngrok-skip-browser-warning'

export function isNgrokApiBaseUrl(baseUrl: string = API_BASE_URL): boolean {
  return /ngrok(-free)?\.app/i.test(baseUrl)
}

/** WebSocket — напрямую на API (Vite proxy для WS часто зависает в pending). */
export function getWebSocketBaseUrl(): string {
  return API_BASE_URL.replace(/\/$/, '')
    .replace(/^https:/, 'wss:')
    .replace(/^http:/, 'ws:')
}
