import { useMemo } from 'react'

import { useCurrentUser } from '@/entities/auth/hooks/useCurrentUser'
import type { UserLanguage } from '@/entities/user/types/types'

const DEFAULT_LANGUAGE: UserLanguage = 'ru'

/**
 * Язык интерфейса для текущего пользователя: из `GET .../auth/current_user`
 * (поле `language` в `BaseUserSchema` на бэке). Кешируется React Query вместе с сессией.
 *
 * Не брать язык из «текущего роута» — URL не является источником правды для локали.
 */
export function useViewerLanguage(): UserLanguage {
  const { data } = useCurrentUser()

  return useMemo(() => {
    const raw = data?.language
    if (raw === 'en' || raw === 'ru') {
      return raw
    }
    return DEFAULT_LANGUAGE
  }, [data?.language])
}
