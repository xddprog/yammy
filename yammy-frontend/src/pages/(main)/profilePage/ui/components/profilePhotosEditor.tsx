import type React from 'react'
import { useCallback, useRef, useState } from 'react'
import { ImagePlus, SquarePen, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { Image, cn } from '@/shared'
import { triggerHaptic } from '@/shared/lib/haptics'

import { MAX_PROFILE_PHOTOS } from './profile.constants'
import type { ProfilePhotoItem } from '../profilePage'

interface ProfilePhotosEditorProps {
  photos: ProfilePhotoItem[]
  setPhotos: React.Dispatch<React.SetStateAction<ProfilePhotoItem[]>>
}

/** Номер слота: как лейблы в `ProfileAutocompleteRow`. */
const SECTION_TITLE_CLASS = 'text-[14px] font-[200] text-foreground'

/** Бейдж номера — скруглённый квадрат. */
const INDEX_BADGE_CLASS =
  'pointer-events-none absolute left-2 top-2 z-10 flex size-6 items-center justify-center rounded-[10px] bg-black/50 text-[11px] font-semibold text-white backdrop-blur-sm'

/** Удаление / эдит: центр круга ближе к визуальному скруглению угла (ниже и левее острого угла). */
const CORNER_BTN_CLASS =
  'pointer-events-auto absolute right-0 top-0 z-20 flex size-7 translate-x-[34%] -translate-y-[30%] items-center justify-center rounded-full bg-black/45 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/55'

export const ProfilePhotosEditor = ({
  photos,
  setPhotos,
}: ProfilePhotosEditorProps): React.JSX.Element => {
  const draggedPhotoIdRef = useRef<string | null>(null)
  const extrasInputRef = useRef<HTMLInputElement>(null)
  const mainInputRef = useRef<HTMLInputElement>(null)
  const holdTimerRef = useRef<number | null>(null)
  const didTriggerHoldHapticRef = useRef(false)
  const [isMainPhotoMenuOpen, setIsMainPhotoMenuOpen] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const mainPhoto = photos.find((p) => p.isMain) ?? photos[0]
  const nonMain = photos.filter((p) => !p.isMain)
  const slots: Array<ProfilePhotoItem | null> = Array.from(
    { length: MAX_PROFILE_PHOTOS },
    (_, i) => nonMain[i] ?? null,
  )

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  const clearHoldTimer = () => {
    if (holdTimerRef.current != null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const onExtrasFiles = (files: FileList | null) => {
    const selected = Array.from(files ?? [])
    if (!selected.length) return
    setPhotos((prev) => {
      const currentNonMain = prev.filter((p) => !p.isMain)
      const available = Math.max(0, MAX_PROFILE_PHOTOS - currentNonMain.length)
      const nextFiles = selected.slice(0, available)
      const nextPhotos = nextFiles.map((file, index) => ({
        id: `photo-upload-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        isMain: false,
      }))
      return [...prev, ...nextPhotos]
    })
  }

  const onMainFile = (file: File | undefined) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPhotos((prev) => {
      const rest = prev.filter((p) => !p.isMain)
      return [{ id: `photo-main-${Date.now()}`, url, isMain: true }, ...rest]
    })
  }

  const setMainPhotoById = (id: string) => {
    setPhotos((prev) => prev.map((p) => ({ ...p, isMain: p.id === id })))
  }

  const getPhotoDragHandlers = useCallback(
    (photoId: string) => ({
      onPointerDown: () => {
        didTriggerHoldHapticRef.current = false
        clearHoldTimer()
        holdTimerRef.current = window.setTimeout(() => {
          didTriggerHoldHapticRef.current = true
          triggerHaptic()
        }, 180)
      },
      onPointerUp: clearHoldTimer,
      onPointerLeave: clearHoldTimer,
      onPointerCancel: clearHoldTimer,
      onDragStart: (event: React.DragEvent<HTMLDivElement>) => {
        clearHoldTimer()
        if (!didTriggerHoldHapticRef.current) triggerHaptic()
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', photoId)
        const img = event.currentTarget.querySelector('img')
        if (img instanceof HTMLImageElement) {
          const w = img.offsetWidth || img.clientWidth
          const h = img.offsetHeight || img.clientHeight
          if (w > 0 && h > 0) {
            event.dataTransfer.setDragImage(img, Math.round(w / 2), Math.round(h / 2))
          }
        }
        draggedPhotoIdRef.current = photoId
        setDraggingId(photoId)
      },
      onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        const dragged = draggedPhotoIdRef.current
        if (dragged && dragged !== photoId) setDragOverId(photoId)
      },
      onDragLeave: (event: React.DragEvent<HTMLDivElement>) => {
        const next = event.relatedTarget as Node | null
        if (!event.currentTarget.contains(next)) {
          setDragOverId((prev) => (prev === photoId ? null : prev))
        }
      },
      onDrop: (event: React.DragEvent) => {
        event.preventDefault()
        const draggedId = draggedPhotoIdRef.current
        if (!draggedId || draggedId === photoId) return
        setPhotos((prev) => {
          const main = prev.find((item) => item.isMain)
          const list = prev.filter((item) => !item.isMain)
          const from = list.findIndex((item) => item.id === draggedId)
          const to = list.findIndex((item) => item.id === photoId)
          if (from < 0 || to < 0) return prev
          const next = [...list]
          const [moved] = next.splice(from, 1)
          next.splice(to, 0, moved)
          return main ? [main, ...next] : next
        })
        draggedPhotoIdRef.current = null
        setDraggingId(null)
        setDragOverId(null)
      },
      onDragEnd: () => {
        draggedPhotoIdRef.current = null
        setDraggingId(null)
        setDragOverId(null)
      },
    }),
    [setPhotos],
  )

  const stopDragFromButton = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  return (
    <section>
      <input
        ref={extrasInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          onExtrasFiles(event.target.files)
          event.currentTarget.value = ''
        }}
      />
      <input
        ref={mainInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          onMainFile(event.target.files?.[0])
          event.currentTarget.value = ''
        }}
      />

      <h2 className={`mb-3 ${SECTION_TITLE_CLASS}`}>Мои фото</h2>

      <div className="grid aspect-square w-full min-h-0 grid-cols-3 grid-rows-3 gap-2 overflow-visible">
        {/* Главное фото: 2×2 */}
        <div className="relative z-0 col-span-2 row-span-2 h-full min-h-0 overflow-visible">
          <div className="relative h-full min-h-0 overflow-visible rounded-2xl">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-transparent">
              {mainPhoto ? (
                <Image
                  src={mainPhoto.url}
                  alt="Главное фото"
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <span className="absolute bottom-2 left-2 z-10 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              Главное фото
            </span>
            <button
              type="button"
              className={CORNER_BTN_CLASS}
              aria-label="Изменить главное фото"
              onPointerDown={stopDragFromButton}
              onMouseDown={stopDragFromButton}
              onClick={() => {
                triggerHaptic()
                setIsMainPhotoMenuOpen(true)
              }}
            >
              <SquarePen className="size-4" strokeWidth={1.35} />
            </button>
          </div>
        </div>

        {slots.slice(0, 2).map((photo, i) => {
          const n = i + 1
          return (
            <div key={photo?.id ?? `slot-${n}`} className="relative z-0 h-full min-h-0 min-w-0 overflow-visible">
              {photo ? (
                <div
                  draggable
                  className={cn(
                    'relative z-0 h-full min-h-0 cursor-grab select-none overflow-visible rounded-2xl transition-[transform,opacity,box-shadow] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] active:cursor-grabbing',
                    draggingId === photo.id && 'scale-[0.96] opacity-[0.55]',
                    dragOverId === photo.id &&
                      draggingId &&
                      draggingId !== photo.id &&
                      'z-10 scale-[1.02] shadow-lg ring-2 ring-[#FF6BA4]/50',
                  )}
                  {...getPhotoDragHandlers(photo.id)}
                >
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-transparent">
                    <Image
                      src={photo.url}
                      alt={`Фото ${n}`}
                      className="size-full object-cover"
                    />
                  </div>
                  <span className={INDEX_BADGE_CLASS}>{n}</span>
                  <button
                    type="button"
                    className={CORNER_BTN_CLASS}
                    aria-label="Удалить фото"
                    onPointerDown={stopDragFromButton}
                    onMouseDown={stopDragFromButton}
                    onClick={() => removePhoto(photo.id)}
                  >
                    <X className="size-4" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => extrasInputRef.current?.click()}
                  className="flex size-full min-h-0 items-center justify-center rounded-2xl bg-card text-muted-foreground transition-colors hover:bg-background/75 hover:text-foreground"
                  aria-label="Добавить фото"
                >
                  <ImagePlus className="size-7" strokeWidth={1.35} />
                </button>
              )}
            </div>
          )
        })}

        {slots.slice(2, 5).map((photo, i) => {
          const n = i + 3
          return (
            <div key={photo?.id ?? `slot-${n}`} className="relative z-0 h-full min-h-0 min-w-0 overflow-visible">
              {photo ? (
                <div
                  draggable
                  className={cn(
                    'relative z-0 h-full min-h-0 cursor-grab select-none overflow-visible rounded-2xl transition-[transform,opacity,box-shadow] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] active:cursor-grabbing',
                    draggingId === photo.id && 'scale-[0.96] opacity-[0.55]',
                    dragOverId === photo.id &&
                      draggingId &&
                      draggingId !== photo.id &&
                      'z-10 scale-[1.02] shadow-lg ring-2 ring-[#FF6BA4]/50',
                  )}
                  {...getPhotoDragHandlers(photo.id)}
                >
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-transparent">
                    <Image
                      src={photo.url}
                      alt={`Фото ${n}`}
                      className="size-full object-cover"
                    />
                  </div>
                  <span className={INDEX_BADGE_CLASS}>{n}</span>
                  <button
                    type="button"
                    className={CORNER_BTN_CLASS}
                    aria-label="Удалить фото"
                    onPointerDown={stopDragFromButton}
                    onMouseDown={stopDragFromButton}
                    onClick={() => removePhoto(photo.id)}
                  >
                    <X className="size-4" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => extrasInputRef.current?.click()}
                  className="flex size-full min-h-0 items-center justify-center rounded-2xl bg-card text-muted-foreground transition-colors hover:bg-background/75 hover:text-foreground"
                  aria-label="Добавить фото"
                >
                  <ImagePlus className="size-6" strokeWidth={1} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {isMainPhotoMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-start justify-end px-4 pt-28"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-black/20"
              onClick={() => setIsMainPhotoMenuOpen(false)}
              aria-label="Закрыть меню"
            />
            <motion.div
              className="relative z-10 w-[220px] shrink-0 self-start rounded-[24px] bg-card p-1.5 shadow-2xl backdrop-blur-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  className="w-full rounded-[16px] px-3 py-2.5 text-left text-[13px] font-[200] text-foreground transition-colors hover:bg-background/60"
                  onClick={() => {
                    setIsMainPhotoMenuOpen(false)
                    mainInputRef.current?.click()
                  }}
                >
                  Загрузить новое фото
                </button>
                {nonMain.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="w-full rounded-[16px] px-3 py-2.5 text-left text-[13px] font-[200] text-foreground transition-colors hover:bg-background/60"
                    onClick={() => {
                      triggerHaptic()
                      setMainPhotoById(photo.id)
                      setIsMainPhotoMenuOpen(false)
                    }}
                  >
                    Фото {index + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-3 text-center text-[12px] font-light text-muted-foreground">
        Перетащите, чтобы изменить порядок
      </p>
    </section>
  )
}
