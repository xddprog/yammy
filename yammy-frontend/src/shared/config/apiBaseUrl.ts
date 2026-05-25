export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/'

/** WebSocket — напрямую на API (Vite proxy для WS часто зависает в pending). */
export function getWebSocketBaseUrl(): string {
  return API_BASE_URL.replace(/\/$/, '')
    .replace(/^https:/, 'wss:')
    .replace(/^http:/, 'ws:')
}
