import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared'

interface ChatHeaderProps {
  name: string
  avatar: string
  online?: boolean
}

export const ChatHeader = ({ name, avatar, online }: ChatHeaderProps) => {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(-1)}
        className="h-10 w-10 shrink-0 rounded-full hover:bg-muted/50 active:scale-90"
      >
        <ChevronLeft size={24} strokeWidth={2.5} className="text-foreground" />
      </Button>

      <div className="flex items-center gap-3">
        <div className="relative h-[45px] w-[45px] shrink-0">
          <div className="h-full w-full overflow-hidden rounded-full border border-white/5">
            <img src={avatar} alt={name} className="h-full w-full object-cover" />
          </div>
          {online && (
            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[16px] font-medium leading-tight text-foreground">{name}</span>
          <span className="text-[12px] font-light text-muted-foreground/60">
            {online ? 'В сети' : 'Был(а) недавно'}
          </span>
        </div>
      </div>
    </div>
  )
}
