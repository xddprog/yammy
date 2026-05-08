import { Check, ChevronLeft } from 'lucide-react'
import type { JSX } from 'react'

interface ProfileHeaderProps {
  onBack: () => void
  onSave: () => void
}

/** Шапка режима редактирования: заголовок «Профиль» + две кнопки справа в ряд. */
export const ProfileHeader = ({ onBack, onSave }: ProfileHeaderProps): JSX.Element => (
  <header className="relative z-10 mb-2 flex min-h-11 items-center justify-between gap-3">
    <h1 className="min-w-0 shrink text-[22px] font-bold uppercase leading-none tracking-tight text-white">
      Профиль
    </h1>
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        className="flex size-11 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-card/85"
        aria-label="Назад к профилю"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={onSave}
        className="flex size-11 items-center justify-center rounded-full bg-card text-[#FF6BA4] transition-colors hover:bg-card/85"
        aria-label="Сохранить изменения"
      >
        <Check className="size-5" strokeWidth={2.2} />
      </button>
    </div>
  </header>
)
