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
    <header className="flex items-center mt-5 justify-between">
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

    <section className="flex flex-col items-center gap-2 pt-1">
      <Image src={avatarUrl} alt="Profile avatar" className="h-[150px] w-[110px] rounded-[22px] object-cover" />
      <h1 className="text-center text-[22px] mt-3 font-[300] leading-none tracking-tight">{title}</h1>
      {screen === 'view' ? (
        <Button
          type="button"
          onClick={onOpenEdit}
          variant="default"
          size="sm"
          className="h-10 min-w-[200px] text-[13px] font-[200]"
        >
          Редактировать
        </Button>
      ) : null}
    </section>
  </>
)
