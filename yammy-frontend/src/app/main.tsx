import '@shared/styles/index.css'

import { createRoot } from 'react-dom/client'

import { ErrorBoundary } from '@/shared'

import { App } from './app'

interface TelegramWebApp {
  ready: () => void
  isVersionAtLeast: (version: string) => boolean
  disableVerticalSwipes: () => void
}

interface TelegramWindow extends Window {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}

const telegramWindow = window as TelegramWindow
const telegramWebApp = telegramWindow.Telegram?.WebApp

if (telegramWebApp) {
  telegramWebApp.ready()

  if (telegramWebApp.disableVerticalSwipes) {
    telegramWebApp.disableVerticalSwipes()
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}
createRoot(rootEl).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
