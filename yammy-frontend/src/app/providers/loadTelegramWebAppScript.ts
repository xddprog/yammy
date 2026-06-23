import { readTelegramInitDataFromLaunch } from './readTelegramInitData'

const TELEGRAM_WEB_APP_SCRIPT = 'https://telegram.org/js/telegram-web-app.js'

/** Не вешать загрузку на index.html — иначе main.tsx не стартует, пока telegram.org не ответит. */
export function loadTelegramWebAppScript(): Promise<void> {
  // Desktop/Web: нативный stub WebApp без initData — всё равно грузим SDK, он прочитает #tgWebAppData.
  if (readTelegramInitDataFromLaunch()) {
    return Promise.resolve()
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${TELEGRAM_WEB_APP_SCRIPT}"]`,
  )
  if (existing) {
    return new Promise((resolve, reject) => {
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
