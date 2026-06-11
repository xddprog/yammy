import { isNgrokMediaUrl, resolveNgrokMediaSrc } from './ngrokBypass'

/** Включён ли dev-обход ngrok. `VITE_NGROK_MEDIA_BYPASS=off` — выкл. без удаления файлов. */
export function isMediaSrcResolverEnabled(): boolean {
  return import.meta.env.VITE_NGROK_MEDIA_BYPASS !== 'off'
}

export function needsAsyncMediaResolve(url: string): boolean {
  return isMediaSrcResolverEnabled() && isNgrokMediaUrl(url)
}

export async function resolveMediaSrc(url: string): Promise<string> {
  if (!needsAsyncMediaResolve(url)) {
    return url
  }
  return resolveNgrokMediaSrc(url)
}

export function prefetchMediaSrc(url: string): void {
  if (!url) {
    return
  }
  if (needsAsyncMediaResolve(url)) {
    void resolveMediaSrc(url).catch(() => undefined)
    return
  }
  const img = new window.Image()
  img.src = url
}
