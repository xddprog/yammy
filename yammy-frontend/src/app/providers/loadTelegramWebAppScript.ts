const TELEGRAM_WEB_APP_SCRIPT = 'https://telegram.org/js/telegram-web-app.js'

function telegramBridgeInitData(): string | null {
  const initData = (
    window as Window & { Telegram?: { WebApp?: { initData?: string } } }
  ).Telegram?.WebApp?.initData?.trim()
  return initData || null
}

function isScriptOnPage(): boolean {
  return Boolean(document.querySelector(`script[src="${TELEGRAM_WEB_APP_SCRIPT}"]`))
}

/** Дожидается telegram-web-app.js (из index.html или подгружает). */
export function loadTelegramWebAppScript(): Promise<void> {
  if (telegramBridgeInitData()) {
    return Promise.resolve()
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${TELEGRAM_WEB_APP_SCRIPT}"]`,
  )
  if (existing) {
    return new Promise((resolve, reject) => {
      if (telegramBridgeInitData()) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('telegram-web-app.js')), {
        once: true,
      })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TELEGRAM_WEB_APP_SCRIPT
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('telegram-web-app.js'))
    document.head.appendChild(script)
  })
}

export function isTelegramWebAppScriptPresent(): boolean {
  return isScriptOnPage() || Boolean(telegramBridgeInitData())
}
