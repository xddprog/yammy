/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** `user` — stub в первого юзера; `onboarding` — dev onboarding JWT */
  readonly VITE_DEV_AUTH?: 'user' | 'onboarding'
  readonly VITE_DEV_ONBOARDING_TELEGRAM_ID?: string
  /** `off` — отключить ngrok blob-обход для фото (см. shared/lib/media/index.ts) */
  readonly VITE_NGROK_MEDIA_BYPASS?: 'off'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
