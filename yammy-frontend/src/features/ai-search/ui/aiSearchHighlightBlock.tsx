import { Sparkles } from 'lucide-react'
import type { JSX } from 'react'
import { memo } from 'react'

interface AiSearchHighlightBlockProps {
  text: string | null
}

const AiSearchHighlightBlock = ({ text }: AiSearchHighlightBlockProps): JSX.Element => {
  const displayText = text?.trim() || 'Подобрали по вашему AI-поиску'

  return (
    <div className="shrink-0 rounded-[20px] bg-card px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2">
        <Sparkles className="size-4 shrink-0 text-[#FF6BA4]" strokeWidth={1.75} />
        <p className="text-[11px] font-[200] uppercase tracking-[0.04em] text-muted-foreground">
          Почему подошла
        </p>
      </div>
      <p className="text-[13px] font-[200] leading-snug text-foreground">{displayText}</p>
    </div>
  )
}

export const AiSearchHighlightBlockMemo = memo(AiSearchHighlightBlock)
