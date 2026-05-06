import '@shared/styles/index.css'

import { createRoot } from 'react-dom/client'

import { ErrorBoundary } from '@/shared'

import { App } from './app'
import { TelegramProvider } from './providers/TelegramProvider'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}
createRoot(rootEl).render(
  <ErrorBoundary>
    <TelegramProvider>
      <App />
    </TelegramProvider>
  </ErrorBoundary>,
)
