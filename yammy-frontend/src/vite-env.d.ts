/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** `user` — stub в первого юзера; `onboarding` — dev onboarding JWT */
  readonly VITE_DEV_AUTH?: 'user' | 'onboarding'
  readonly VITE_DEV_ONBOARDING_TELEGRAM_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
