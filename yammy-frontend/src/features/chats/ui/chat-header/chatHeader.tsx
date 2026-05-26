import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { formatLastSeenLabel } from '@/entities/chat'
import { Button, cn } from '@/shared'

import { TypingStatusLabel } from './typingStatusLabel'

interface ChatHeaderProps {
  name: string
  age?: number
  avatar: string
  online?: boolean
  isTyping?: boolean
  lastSeen?: string | null
  isBanned?: boolean
  profileLocked?: boolean
  onAvatarClick?: () => void
}

export const ChatHeader = ({
  name,
  age,
  avatar,
  online,
  isTyping = false,
  lastSeen,
  isBanned = false,
  profileLocked = false,
  onAvatarClick,
}: ChatHeaderProps) => {
  const navigate = useNavigate()
  const statusLabel = online ? 'в сети' : formatLastSeenLabel(lastSeen)
  const displayName = isBanned ? 'Аккаунт забанен' : name

  return (
    <div className="flex items-center gap-2 px-1 py-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(-1)}
        className="h-11 w-11 shrink-0 rounded-full bg-card text-foreground hover:bg-card/90 active:scale-90"
      >
        <ChevronLeft strokeWidth={2.5} className="text-foreground size-[22px]" />
      </Button>

      <div className="min-w-0 flex-1 flex justify-center px-1">
        <div className="inline-flex min-w-0 max-w-full h-11 items-center rounded-full bg-card px-7">
          <div className="min-w-0 text-center">
            <div className="truncate text-[15px] font-[400] leading-tight text-foreground">
              {isBanned ? displayName : age !== undefined ? `${displayName}, ${age}` : displayName}
            </div>
            <div
              className={cn(
                'truncate text-[11px] font-[100] leading-tight',
                online || isTyping ? 'text-[#FF6BA4]' : 'text-muted-foreground',
              )}
            >
              {isTyping ? <TypingStatusLabel /> : statusLabel}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onAvatarClick}
        disabled={profileLocked || !onAvatarClick}
        className="relative h-[44px] w-[44px] shrink-0 overflow-hidden rounded-full border border-card-foreground/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        aria-label={profileLocked ? 'Профиль недоступен' : `Открыть профиль ${name}`}
      >
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      </button>
    </div>
  )
}
