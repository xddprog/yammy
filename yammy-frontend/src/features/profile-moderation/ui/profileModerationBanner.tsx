import type { JSX } from 'react'

import type { ProfileModerationStatus } from '@/entities/user/types/types'
import { cn } from '@/shared'

const TITLES: Record<Exclude<ProfileModerationStatus, 'approved'>, string> = {
  pending: 'На модерации',
  rejected: 'Не прошла модерация',
}

const DEFAULT_MESSAGES: Record<Exclude<ProfileModerationStatus, 'approved'>, string> = {
  pending:
    'Анкета скрыта из ленты, пока мы проверяем изменения. Обычно это занимает немного времени.',
  rejected:
    'Исправьте профиль и дождитесь повторной проверки — после одобрения анкета снова появится в ленте.',
}

interface ProfileModerationBannerProps {
  status: ProfileModerationStatus | undefined
  note?: string | null
  className?: string
}

export function ProfileModerationBanner({
  status,
  note,
  className,
}: ProfileModerationBannerProps): JSX.Element | null {
  if (!status || status === 'approved') {
    return null
  }

  const isRejected = status === 'rejected'
  const trimmedNote = note?.trim()

  return (
    <div
      className={cn(
        'rounded-[24px] px-4 py-3.5 leading-snug shadow-sm',
        isRejected
          ? 'border-2 border-[#FF6BA4] bg-white text-[#2a2a2a]'
          : 'border border-amber-300/80 bg-white text-[#2a2a2a]',
        className,
      )}
      role="alert"
    >
      <p
        className={cn(
          'mb-1.5 text-[13px] font-bold uppercase tracking-wide',
          isRejected ? 'text-[#FF6BA4]' : 'text-amber-600',
        )}
      >
        {TITLES[status]}
      </p>
      <p className="text-[14px] font-[200] leading-snug">
        {trimmedNote ?? DEFAULT_MESSAGES[status]}
      </p>
    </div>
  )
}
