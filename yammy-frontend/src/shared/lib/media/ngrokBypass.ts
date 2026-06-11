/**
 * DEV ONLY — обход ngrok browser warning для <img> на мобильном TMA.
 *
 * Удаление: см. комментарий в ./index.ts
 */
import { NGROK_SKIP_BROWSER_WARNING_HEADER } from '@/shared/config/apiBaseUrl'

export function isNgrokMediaUrl(url: string): boolean {
  return Boolean(url) && /ngrok(-free)?\.app/i.test(url)
}

const blobUrlBySource = new Map<string, string>()
const inflightBySource = new Map<string, Promise<string>>()

async function fetchNgrokBlobUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { [NGROK_SKIP_BROWSER_WARNING_HEADER]: '1' },
  })
  if (!response.ok) {
    throw new Error(`Failed to load media: ${response.status}`)
  }
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

export async function resolveNgrokMediaSrc(url: string): Promise<string> {
  const cached = blobUrlBySource.get(url)
  if (cached) {
    return cached
  }

  let inflight = inflightBySource.get(url)
  if (!inflight) {
    inflight = fetchNgrokBlobUrl(url)
      .then((blobUrl) => {
        blobUrlBySource.set(url, blobUrl)
        inflightBySource.delete(url)
        return blobUrl
      })
      .catch((error) => {
        inflightBySource.delete(url)
        throw error
      })
    inflightBySource.set(url, inflight)
  }

  return inflight
}
