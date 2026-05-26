import { Check, Forward, Pencil, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button, cn, Image, useOverlay } from '@/shared'

export type MessageReplyTarget = { id: string; text: string; name: string }
export type MessageEditTarget = {
  id: string
  text: string
  originalText: string
  previewText: string
}

interface MessageInputProps {
  onSend: (text?: string, files?: File[], replyTo?: MessageReplyTarget) => void
  onSaveEdit?: (text: string) => void
  replyTo?: MessageReplyTarget | null
  editMessage?: MessageEditTarget | null
  onCancelReply?: () => void
  onCancelEdit?: () => void
  disabled?: boolean
  disabledPlaceholder?: string
  onTyping?: () => void
  onStopTyping?: () => void
}

export const MessageInput = ({
  onSend,
  onSaveEdit,
  replyTo,
  editMessage,
  onCancelReply,
  onCancelEdit,
  disabled = false,
  disabledPlaceholder = 'Сообщение...',
  onTyping,
  onStopTyping,
}: MessageInputProps) => {
  const [value, setValue] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const onCancelReplyRef = useRef(onCancelReply)
  const onCancelEditRef = useRef(onCancelEdit)
  const { open } = useOverlay()

  onCancelReplyRef.current = onCancelReply
  onCancelEditRef.current = onCancelEdit

  const autosizeTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    const maxHeight = 15 * 1.375 * 5
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  useEffect(() => {
    autosizeTextarea()
  }, [value])

  useEffect(() => {
    if (editMessage) {
      setValue(editMessage.text)
      setSelectedFiles([])
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
      setImagePreviews([])
      requestAnimationFrame(() => {
        autosizeTextarea()
        textareaRef.current?.focus()
      })
    }
  }, [editMessage?.id])

  useEffect(() => {
    if (!disabled) {
      return
    }

    setValue('')
    setSelectedFiles([])
    setImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url))
      return []
    })
    onCancelReplyRef.current?.()
    onCancelEditRef.current?.()
    onStopTyping?.()
    requestAnimationFrame(autosizeTextarea)
  }, [disabled, onStopTyping])

  const isEditing = Boolean(editMessage)

  const handleSend = () => {
    if (disabled) {
      return
    }

    onStopTyping?.()

    const trimmed = value.trim()
    const hasText = trimmed.length > 0
    const hasImages = imagePreviews.length > 0

    if (isEditing && editMessage) {
      if (trimmed !== editMessage.originalText.trim()) {
        onSaveEdit?.(trimmed)
        setValue('')
        onCancelEdit?.()
        requestAnimationFrame(autosizeTextarea)
      }
      return
    }

    if (hasText || hasImages) {
      onSend(hasText ? trimmed : undefined, hasImages ? selectedFiles : undefined, replyTo || undefined)
      setValue('')
      setSelectedFiles([])
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
      setImagePreviews([])
      onCancelReply?.()
      requestAnimationFrame(autosizeTextarea)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      e.target.value = ''
      return
    }

    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) {
      const remainingSlots = Math.max(0, 2 - selectedFiles.length)
      const picked = files.slice(0, remainingSlots)
      if (picked.length > 0) {
        setSelectedFiles((prev) => [...prev, ...picked])
        setImagePreviews((prev) => [...prev, ...picked.map((file) => URL.createObjectURL(file))])
      }
    }
    // Reset input so the same file can be picked again
    e.target.value = ''
  }

  const openImagesPreview = (startIndex: number) => {
    if (imagePreviews.length === 0) return
    open({
      backdropClassName: 'bg-black/85 backdrop-blur-0',
      panelClassName: '!h-full !w-full !max-w-none flex items-center justify-center p-4 pointer-events-none',
      content: () => (
        <div className="pointer-events-auto overflow-hidden rounded-[24px] bg-black">
          <Image
            src={imagePreviews[startIndex]}
            alt="Selected image full"
            className="block h-auto max-h-[88vh] w-auto max-w-[92vw] object-contain"
          />
        </div>
      ),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) {
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSubmit =
    !disabled &&
    (isEditing
      ? editMessage != null && value.trim() !== editMessage.originalText.trim()
      : value.trim().length > 0 || imagePreviews.length > 0)

  return (
    <div className="flex flex-col gap-2 p-4 pt-2">
      {editMessage && (
        <div className="flex items-center gap-3 rounded-[20px] bg-card px-3 py-2.5">
          <Pencil className="size-[18px] shrink-0 text-[#FF6BA4]" strokeWidth={2} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-[200] uppercase tracking-wider text-[#FF6BA4]">
              Изменить сообщение
            </span>
            <p className="truncate text-[13px] font-[100] text-foreground">{editMessage.previewText}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setValue('')
              onCancelEdit?.()
              requestAnimationFrame(autosizeTextarea)
            }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/40 transition-colors hover:text-muted-foreground"
            aria-label="Отменить редактирование"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Reply Preview Bar */}
      {replyTo && !isEditing && (
        <div className="flex items-center gap-3 ml-1 px-3 py-1.5 border-l-2 border-[#FF6BA4]">
          <div className="flex-1 flex flex-col min-w-0">
            <span className="text-[11px] font-[200] text-[#FF6BA4] uppercase tracking-wider">
              {replyTo.name}
            </span>
            <p className="text-[13px] font-[100] text-white-foreground truncate">{replyTo.text}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {imagePreviews.length > 0 && !isEditing && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2.5 no-scrollbar touch-pan-x" style={{ touchAction: 'pan-x' }}>
          {imagePreviews.map((preview, index) => (
            <div
              key={preview}
              className="relative aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-xl shadow-md group"
            >
              <button
                type="button"
                onClick={() => openImagesPreview(index)}
                className="h-full w-full"
                aria-label="Открыть превью фото"
              >
                <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
              </button>
              <button
                onClick={() => {
                  URL.revokeObjectURL(imagePreviews[index])
                  setImagePreviews((prev) => prev.filter((_, i) => i !== index))
                  setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
                }}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:bg-black"
                aria-label="Удалить фото"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        {!isEditing && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={disabled || imagePreviews.length >= 2}
            onClick={() => fileInputRef.current?.click()}
            className="h-12 w-12 shrink-0 rounded-full bg-card text-foreground hover:bg-card/90 active:scale-90 disabled:opacity-40"
          >
            <Plus className="size-[22px]" strokeWidth={2} />
          </Button>
        )}

        <div className="flex min-h-[48px] flex-1 items-center rounded-[24px] bg-card px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-[#FF6BA4]/50">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (!disabled) {
                onTyping?.()
              }
            }}
            onBlur={() => onStopTyping?.()}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? disabledPlaceholder : 'Сообщение...'}
            disabled={disabled}
            className="w-full resize-none border-none bg-transparent py-0 text-[15px] font-[100] leading-snug outline-none no-scrollbar placeholder:font-[100] placeholder:text-muted-foreground"
            rows={1}
            style={{ height: 'auto', maxHeight: 'calc(1.375em * 5)' }}
          />
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={!canSubmit}
          onClick={handleSend}
          className={cn(
            'h-12 w-12 shrink-0 rounded-full !p-0 transition-all active:scale-95',
            canSubmit
              ? 'bg-[#FF6BA4] text-white shadow-lg shadow-[#FF6BA4]/20 hover:bg-[#FF6BA4]/90'
              : 'bg-card text-foreground opacity-100! hover:bg-card/90',
          )}
          aria-label={isEditing ? 'Сохранить изменения' : 'Отправить сообщение'}
        >
          {isEditing ? (
            <Check className="size-[22px]" strokeWidth={2.5} />
          ) : (
            <Forward className="size-[22px]" strokeWidth={2} />
          )}
        </Button>
      </div>
    </div>
  )
}
