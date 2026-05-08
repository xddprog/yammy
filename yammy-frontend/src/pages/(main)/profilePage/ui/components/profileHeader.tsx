import { ChevronLeft } from 'lucide-react'
import type { JSX } from 'react'

import { Button, Image } from '@/shared'

interface ProfileHeaderProps {
  screen: 'view' | 'edit'
  title: string
  avatarUrl: string
  onBack: () => void
  onSave: () => void
  onOpenEdit: () => void
}

export const ProfileHeader = ({
  screen,
  title,
  avatarUrl,
  onBack,
  onSave,
  onOpenEdit,
}: ProfileHeaderProps): JSX.Element => (
  <>
    <header className="flex items-center justify-between">
      {screen === 'edit' ? (
        <button
          type="button"
          onClick={onBack}
          className="flex size-11 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-card/85"
          aria-label="Назад к профилю"
        >
          <ChevronLeft className="size-5" />
        </button>
      ) : (
        <span />
      )}
      {screen === 'edit' && (
        <Button
          type="button"
          onClick={onSave}
          variant="ghost"
          size="sm"
          className="h-9 px-4 text-sm font-[200] text-[#FF6BA4]"
        >
          Save
        </Button>
      )}
    </header>

    <section className="flex flex-col items-center gap-3 pt-1">
      <Image src={avatarUrl} alt="Profile avatar" className="size-[118px] rounded-[30px] object-cover" />
      <h1 className="text-center text-[28px] font-bold leading-none tracking-tight">{title}</h1>
      {screen === 'view' ? (
        <Button type="button" onClick={onOpenEdit} variant="default" size="lg" className="h-11 min-w-[220px] text-base font-[200]">
          Edit profile info
        </Button>
      ) : null}
    </section>
  </>
)
