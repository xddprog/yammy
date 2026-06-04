import type { WebApp } from '@twa-dev/types'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

import { loadTelegramWebAppScript } from './loadTelegramWebAppScript'

const TelegramContext = createContext<WebApp | null>(null)

interface TelegramProviderProps {
  children: ReactNode
}

export const TelegramProvider = ({ children }: TelegramProviderProps) => {
  const [tg, setTg] = useState<WebApp | null>(
    () => (window as Window & { Telegram?: { WebApp?: WebApp } }).Telegram?.WebApp ?? null,
  )

  useEffect(() => {
    if (tg) {
      return
    }

    let cancelled = false
    void loadTelegramWebAppScript()
      .then(() => {
        if (cancelled) {
          return
        }
        const webApp = (window as Window & { Telegram?: { WebApp?: WebApp } }).Telegram?.WebApp
        if (webApp) {
          setTg(webApp)
        }
      })
      .catch(() => {
        if (!cancelled) {
          console.log('[TelegramProvider] Telegram WebApp script unavailable')
        }
      })

    return () => {
      cancelled = true
    }
  }, [tg])

  useEffect(() => {
    if (!tg) {
      return
    }

    tg.ready()
    tg.expand()

    if (typeof tg.disableVerticalSwipes === 'function') {
      tg.disableVerticalSwipes()
    }
  }, [tg])

  return <TelegramContext.Provider value={tg}>{children}</TelegramContext.Provider>
}

export const useTelegram = (): WebApp | null => useContext(TelegramContext)
