function urlSafeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, '%20'))
  } catch {
    return value
  }
}

function parseTelegramHashParams(locationHash: string): Record<string, string> {
  let hash = locationHash.replace(/^#/, '')
  const params: Record<string, string> = {}
  if (!hash.length) {
    return params
  }

  const qIndex = hash.indexOf('?')
  if (qIndex >= 0) {
    hash = hash.slice(qIndex + 1)
  }

  for (const part of hash.split('&')) {
    const eq = part.indexOf('=')
    if (eq < 0) {
      continue
    }
    params[urlSafeDecode(part.slice(0, eq))] = urlSafeDecode(part.slice(eq + 1))
  }

  return params
}

function readInitDataFromSessionStorage(): string | null {
  try {
    const raw = window.sessionStorage.getItem('__telegram__initParams')
    if (!raw) {
      return null
    }
    const params = JSON.parse(raw) as { tgWebAppData?: string }
    return params.tgWebAppData?.trim() || null
  } catch {
    return null
  }
}

/** initData из bridge, hash (#tgWebAppData=…) или sessionStorage telegram-web-app.js */
export function readTelegramInitDataFromLaunch(): string | null {
  const fromBridge = (
    window as Window & { Telegram?: { WebApp?: { initData?: string } } }
  ).Telegram?.WebApp?.initData?.trim()
  if (fromBridge) {
    return fromBridge
  }

  const fromHash = parseTelegramHashParams(window.location.hash).tgWebAppData?.trim()
  if (fromHash) {
    return fromHash
  }

  return readInitDataFromSessionStorage()
}
