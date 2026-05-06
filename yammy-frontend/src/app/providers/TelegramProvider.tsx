import type { Telegram, WebApp } from '@twa-dev/types'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo } from 'react'

const TelegramContext = createContext<WebApp | null>(null)

interface TelegramProviderProps {
  children: ReactNode
}

export const TelegramProvider = ({ children }: TelegramProviderProps) => {
  const tg = (window as Window & { Telegram?: Telegram }).Telegram?.WebApp ?? null

  const value = useMemo(() => tg, [tg])

  useEffect(() => {
    if (!tg) {
      console.log('[TelegramProvider] Telegram WebApp is not available')
      return
    }

    console.log('[TelegramProvider] Initializing Telegram WebApp', {
      version: tg.version,
      platform: tg.platform,
      initData: tg.initData,
      hasDisableVerticalSwipes: tg.disableVerticalSwipes
    })

    tg.ready()
    tg.expand()
    console.log('[TelegramProvider] WebApp ready and expanded')

    if (typeof tg.disableVerticalSwipes === 'function') {
      tg.disableVerticalSwipes()
      console.log('[TelegramProvider] Vertical swipes disabled')
    }
  }, [tg])

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
}

export const useTelegram = (): WebApp | null => useContext(TelegramContext)

