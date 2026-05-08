import { Check, ChevronLeft, SquarePen } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { JSX } from 'react'
import { useRef, useState } from 'react'

import { Button, Image } from '@/shared'
import { triggerHaptic } from '@/shared/lib/haptics'

interface ProfileHeaderProps {
  screen: 'view' | 'edit'
  title: string
  avatarUrl: string
  onBack: () => void
  onSave: () => void
  onOpenEdit: () => void
  nonMainPhotos: Array<{ id: string; url: string }>
  onUploadMainPhoto: (url: string) => void
  onSetMainPhoto: (id: string) => void
}

export const ProfileHeader = ({
  screen,
  title,
  avatarUrl,
  onBack,
  onSave,
  onOpenEdit,
  nonMainPhotos,
  onUploadMainPhoto,
  onSetMainPhoto,
}: ProfileHeaderProps): JSX.Element => {
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false)
  const mainPhotoInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      {screen === 'edit' && (
        <header className="relative z-10 -mx-1 mb-1 mt-2 flex min-h-11 items-center justify-between px-1 py-1">
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
        </header>
      )}

      <section className="flex flex-col items-center gap-2 pt-0">
        <div className="relative">
          <Image
            src={avatarUrl}
            alt="Profile avatar"
            className="h-[150px] w-[110px] rounded-[22px] object-cover"
          />
          {screen === 'edit' && (
            <>
              <input
                ref={mainPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  const url = URL.createObjectURL(file)
                  onUploadMainPhoto(url)
                  event.currentTarget.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => {
                  triggerHaptic()
                  setIsPhotoMenuOpen(true)
                }}
                className="absolute -bottom-3 -right-3 flex size-11 items-center justify-center rounded-full bg-[#C5F46D] text-[#141414] shadow-lg"
                aria-label="Изменить главное фото"
              >
                <SquarePen className="size-5" />
              </button>
            </>
          )}
        </div>
        <h1 className="mt-3 text-center text-[22px] font-[300] leading-none tracking-tight">{title}</h1>
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

      <AnimatePresence>
        {isPhotoMenuOpen && (
          <motion.div
            className="absolute inset-0 z-[70] flex items-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-black/20"
              onClick={() => setIsPhotoMenuOpen(false)}
              aria-label="Закрыть меню фото"
            />
            <motion.div
              className="absolute right-4 top-[188px] w-[220px] rounded-[24px] bg-card p-1.5 shadow-2xl backdrop-blur-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  className="w-full rounded-[16px] px-3 py-2.5 text-left text-[13px] font-[200] text-foreground transition-colors hover:bg-background/60"
                  onClick={() => {
                    setIsPhotoMenuOpen(false)
                    mainPhotoInputRef.current?.click()
                  }}
                >
                  Загрузить новое фото
                </button>
                {nonMainPhotos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="w-full rounded-[16px] px-3 py-2.5 text-left text-[13px] font-[200] text-foreground transition-colors hover:bg-background/60"
                    onClick={() => {
                      triggerHaptic()
                      onSetMainPhoto(photo.id)
                      setIsPhotoMenuOpen(false)
                    }}
                  >
                    Сделать главным фото {index + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
