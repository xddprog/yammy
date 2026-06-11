/**
 * URL медиа с API (фото профиля, лента).
 *
 * Точки входа для приложения — только этот файл.
 *
 * --- Убрать ngrok-обход (постоянный домен вместо ngrok) ---
 * 1. Удалить `ngrokBypass.ts`
 * 2. В `resolveMediaSrc.ts` оставить только:
 *    export function isMediaSrcResolverEnabled() { return false }
 *    export function needsAsyncMediaResolve() { return false }
 *    export async function resolveMediaSrc(url: string) { return url }
 *    export function prefetchMediaSrc(url: string) {
 *      if (!url) return
 *      const img = new window.Image()
 *      img.src = url
 *    }
 * 3. `useResolvedMediaSrc.ts` и импорты из `@/shared/lib/media` не трогать.
 * --- или временно: VITE_NGROK_MEDIA_BYPASS=off ---
 */
export { prefetchMediaSrc, resolveMediaSrc } from './resolveMediaSrc'
export { useResolvedMediaSrc } from './useResolvedMediaSrc'
