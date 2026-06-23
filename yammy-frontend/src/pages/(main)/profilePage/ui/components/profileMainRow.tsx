import { SquarePen } from 'lucide-react'
import type { JSX } from 'react'

import { Image, cn } from '@/shared'

const AVATAR_SIZE = 48

interface ProfileMainRowProps {
  avatarUrl: string
  title: string
  onOpenEdit: () => void
}

export const ProfileMainRow = ({
  avatarUrl,
  title,
  onOpenEdit,
}: ProfileMainRowProps): JSX.Element => (
  <button
    type="button"
    onClick={onOpenEdit}
    className={cn(
      'flex w-full items-center gap-3 rounded-[28px] bg-card px-4 py-4 text-left transition-colors',
      'hover:bg-card/85 active:scale-[0.99]',
    )}
    aria-label="Редактировать профиль"
  >
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
    >
      <Image
        src={avatarUrl}
        alt={`Фото профиля: ${title}`}
        className="block size-full min-h-0 min-w-0 object-cover"
      />
    </div>
    <span className="min-w-0 flex-1 truncate text-[14px] font-[200] text-foreground">{title}</span>
    <SquarePen className="size-4 shrink-0 text-muted-foreground" strokeWidth={0.5} aria-hidden />
  </button>
)
