import '@shared/styles/index.css'

import { createRoot } from 'react-dom/client'

import { ErrorBoundary } from '@/shared'

import { App } from './app'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}
createRoot(rootEl).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
