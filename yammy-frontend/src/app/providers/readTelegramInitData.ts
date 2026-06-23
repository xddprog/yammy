const INIT_DATA_CACHE_KEY = 'yammy_tg_init_data'

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

function readCachedInitData(): string | null {
  try {
    return sessionStorage.getItem(INIT_DATA_CACHE_KEY)?.trim() || null
  } catch {
    return null
  }
}

/** Сохраняем initData при первом запуске — после reload hash часто пустой. */
export function rememberTelegramInitData(initData: string): void {
  const trimmed = initData.trim()
  if (!trimmed) {
    return
  }
  try {
    sessionStorage.setItem(INIT_DATA_CACHE_KEY, trimmed)
  } catch {
    /* quota / private mode */
  }
}

/** initData из bridge, hash (#tgWebAppData=…), sessionStorage telegram-web-app.js или кэш */
export function readTelegramInitDataFromLaunch(): string | null {
  const fromBridge = (
    window as Window & { Telegram?: { WebApp?: { initData?: string } } }
  ).Telegram?.WebApp?.initData?.trim()
  if (fromBridge) {
    rememberTelegramInitData(fromBridge)
    return fromBridge
  }

  const fromHash = parseTelegramHashParams(window.location.hash).tgWebAppData?.trim()
  if (fromHash) {
    rememberTelegramInitData(fromHash)
    return fromHash
  }

  const fromTelegramStorage = readInitDataFromSessionStorage()
  if (fromTelegramStorage) {
    rememberTelegramInitData(fromTelegramStorage)
    return fromTelegramStorage
  }

  return readCachedInitData()
}
