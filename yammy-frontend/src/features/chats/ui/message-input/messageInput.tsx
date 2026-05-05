import { Plus, SendHorizontal, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button, cn } from '@/shared'

interface MessageInputProps {
  onSend: (
    text?: string,
    image?: string,
    replyTo?: { id: string; text: string; name: string },
  ) => void
  replyTo?: { id: string; text: string; name: string } | null
  onCancelReply?: () => void
}

export const MessageInput = ({ onSend, replyTo, onCancelReply }: MessageInputProps) => {
  const [value, setValue] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (value.trim() || imagePreview) {
      onSend(value.trim() || undefined, imagePreview || undefined, replyTo || undefined)
      setValue('')
      setImagePreview(null)
      onCancelReply?.()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    }
    // Reset input so the same file can be picked again
    e.target.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col gap-2 p-4 pt-2">
      {/* Reply Preview Bar */}
      {replyTo && (
        <div className="ml-1 flex items-center gap-3 border-l-2 border-primary px-3 py-1.5">
          <div className="flex-1 flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              {replyTo.name}
            </span>
            <p className="text-[13px] font-light text-muted-foreground truncate">{replyTo.text}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="relative ml-2 h-24 w-24 overflow-hidden rounded-xl group">
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={() => setImagePreview(null)}
            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:bg-black"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          className="h-12 w-12 shrink-0 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 active:scale-90"
        >
          <Plus size={24} strokeWidth={2} />
        </Button>

        <div className="flex min-h-[48px] flex-1 items-center rounded-full bg-muted px-4 transition-all focus-within:ring-2 focus-within:ring-primary/50">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение..."
            className="max-h-32 w-full resize-none border-none bg-transparent py-3 text-[15px] font-extralight leading-snug outline-none no-scrollbar placeholder:font-extralight placeholder:text-muted-foreground/40"
            rows={1}
            style={{ height: 'auto' }}
          />
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={!value.trim() && !imagePreview}
          onClick={handleSend}
          className={cn(
            'h-12 w-12 shrink-0 rounded-full transition-all active:scale-95',
            value.trim() || imagePreview
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-muted text-muted-foreground opacity-100! hover:bg-muted',
          )}
        >
          <SendHorizontal size={20} strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}
