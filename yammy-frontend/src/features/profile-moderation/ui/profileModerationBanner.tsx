import type { JSX } from 'react'
import { TriangleAlert } from 'lucide-react'

import type { ProfileModerationStatus } from '@/entities/user/types/types'
import { cn } from '@/shared'

const TITLE = 'Не прошла модерация'
const DEFAULT_COMMENT = 'Исправьте профиль и дождитесь повторной проверки'

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
  if (status !== 'rejected') {
    return null
  }

  const comment = note?.trim() || DEFAULT_COMMENT

  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 rounded-[28px] border px-4 py-4',
        'border-[#9B2335]/70 bg-[#3D1219] text-white',
        className,
      )}
      role="alert"
    >
      <TriangleAlert className="size-5 shrink-0 text-[#FF6BA4]" strokeWidth={1.75} aria-hidden />
      <p className="min-w-0 flex-1 text-[14px] font-[200] leading-snug">
        {TITLE}: {comment}
      </p>
    </div>
  )
}
