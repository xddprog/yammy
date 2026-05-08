import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
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

/** Hit-test по внешним ячейкам сетки (они не двигаются transform’ом — без ложных переключений). */
function pickSlotIndexUnderPointStable(
  clientX: number,
  clientY: number,
  cells: Array<HTMLDivElement | null | undefined>,
): number | null {
  let best: { i: number; d2: number } | null = null
  for (let i = 0; i < cells.length; i++) {
    const el = cells[i]
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) continue
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const d2 = (clientX - cx) ** 2 + (clientY - cy) ** 2
    if (!best || d2 < best.d2) best = { i, d2 }
  }
  return best?.i ?? null
}

/** Превью обмена: палец ближе к центру цели, чем к центру источника — не вдоль прямой между фото. */
const SWAP_CLOSER_MARGIN_ENTER_PX = 14
const SWAP_CLOSER_MARGIN_EXIT_PX = 6

function usePhotoReorderMode(): 'html5' | 'pointer' {
  const [mode, setMode] = useState<'html5' | 'pointer'>('html5')
  useEffect(() => {
    const w = window as Window & { Telegram?: { WebApp?: unknown } }
    if (w.Telegram?.WebApp != null) {
      setMode('pointer')
      return
    }
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    const apply = () => setMode(mq.matches ? 'pointer' : 'html5')
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return mode
}

export const ProfilePhotosEditor = ({
  photos,
  setPhotos,
}: ProfilePhotosEditorProps): React.JSX.Element => {
  const reorderMode = usePhotoReorderMode()
  const photosRef = useRef(photos)
  photosRef.current = photos

  const draggedPhotoIdRef = useRef<string | null>(null)
  const extrasInputRef = useRef<HTMLInputElement>(null)
  const mainInputRef = useRef<HTMLInputElement>(null)
  const holdTimerRef = useRef<number | null>(null)
  const didTriggerHoldHapticRef = useRef(false)
  const dragSourceIndexRef = useRef<number | null>(null)
  const slotRectsSnapshotRef = useRef<DOMRect[] | null>(null)
  const slotCellRefs = useRef<Array<HTMLDivElement | null>>([])
  /** Скрываем исходную ячейку после того, как браузер снял drag-preview — иначе «две копии». */
  const dragSourceElRef = useRef<HTMLDivElement | null>(null)
  const pointerDownActiveRef = useRef(false)
  const pointerReorderActiveRef = useRef(false)
  const pointerHoldPhotoIdRef = useRef<string | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const pendingPointerCaptureRef = useRef<{
    pointerId: number
    el: HTMLDivElement
  } | null>(null)

  const HOLD_MS = 180
  const MOVE_CANCEL_HOLD_PX = 14

  const [isMainPhotoMenuOpen, setIsMainPhotoMenuOpen] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [swapPreviewWithIndex, setSwapPreviewWithIndex] = useState<number | null>(null)
  const swapPreviewSyncRef = useRef<number | null>(null)
  useEffect(() => {
    swapPreviewSyncRef.current = swapPreviewWithIndex
  }, [swapPreviewWithIndex])
  /** Свободное следование за пальцем (Telegram / touch). */
  const [pointerFollow, setPointerFollow] = useState<{
    x: number
    y: number
    w: number
    h: number
  } | null>(null)
  const pointerFloatMetricsRef = useRef<{ w: number; h: number } | null>(null)

  const mainPhoto = photos.find((p) => p.isMain) ?? photos[0]
  const nonMain = photos.filter((p) => !p.isMain)
  const slots: Array<ProfilePhotoItem | null> = Array.from(
    { length: MAX_PROFILE_PHOTOS },
    (_, i) => nonMain[i] ?? null,
  )

  const setSlotRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    slotCellRefs.current[index] = el
  }, [])

  const slotPreviewStyle = (slotIndex: number): React.CSSProperties | undefined => {
    if (draggingId == null) return undefined
    const i = dragSourceIndexRef.current
    const j = swapPreviewWithIndex
    const snap = slotRectsSnapshotRef.current
    if (i == null || j == null || i === j || !snap?.[i] || !snap?.[j]) return undefined
    const rI = snap[i]
    const rJ = snap[j]
    const dLeft = rJ.left - rI.left
    const dTop = rJ.top - rI.top
    if (slotIndex === i) return { transform: `translate(${dLeft}px, ${dTop}px)` }
    if (slotIndex === j) return { transform: `translate(${-dLeft}px, ${-dTop}px)` }
    return undefined
  }

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

  const clearDragVisual = () => {
    const cap = pendingPointerCaptureRef.current
    pendingPointerCaptureRef.current = null

    const releaseCaptureLater = () => {
      if (!cap) return
      try {
        if (typeof cap.el.hasPointerCapture === 'function' && cap.el.hasPointerCapture(cap.pointerId)) {
          cap.el.releasePointerCapture(cap.pointerId)
        }
      } catch {
        // ignore
      }
    }

    pointerReorderActiveRef.current = false
    pointerHoldPhotoIdRef.current = null
    pointerStartRef.current = null
    pointerDownActiveRef.current = false

    if (dragSourceElRef.current) {
      dragSourceElRef.current.style.opacity = ''
      dragSourceElRef.current = null
    }
    draggedPhotoIdRef.current = null
    dragSourceIndexRef.current = null
    slotRectsSnapshotRef.current = null
    pointerFloatMetricsRef.current = null
    setPointerFollow(null)
    setDraggingId(null)
    setSwapPreviewWithIndex(null)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        releaseCaptureLater()
      })
    })
  }

  const updateSwapPreviewAt = useCallback((clientX: number, clientY: number) => {
    const dragged = draggedPhotoIdRef.current
    const from = dragSourceIndexRef.current
    if (!dragged || from == null) return

    const hovered = pickSlotIndexUnderPointStable(clientX, clientY, slotCellRefs.current)
    if (hovered == null || hovered === from) {
      setSwapPreviewWithIndex((p) => (p === null ? p : null))
      return
    }

    const nonMainNow = photosRef.current.filter((p) => !p.isMain)
    const photoAtHovered = nonMainNow[hovered]
    if (!photoAtHovered) {
      setSwapPreviewWithIndex((p) => (p === null ? p : null))
      return
    }

    const snap = slotRectsSnapshotRef.current
    if (!snap?.[from] || !snap?.[hovered]) {
      setSwapPreviewWithIndex((p) => (p === null ? p : null))
      return
    }

    const rcF = snap[from]
    const rcH = snap[hovered]
    const sx = rcF.left + rcF.width / 2
    const sy = rcF.top + rcF.height / 2
    const tx = rcH.left + rcH.width / 2
    const ty = rcH.top + rcH.height / 2
    const distSource = Math.hypot(clientX - sx, clientY - sy)
    const distTarget = Math.hypot(clientX - tx, clientY - ty)
    const margin = distSource - distTarget

    setSwapPreviewWithIndex((prev) => {
      if (prev == null) {
        return margin > SWAP_CLOSER_MARGIN_ENTER_PX ? hovered : null
      }
      if (prev === hovered) {
        return margin < SWAP_CLOSER_MARGIN_EXIT_PX ? null : hovered
      }
      return margin > SWAP_CLOSER_MARGIN_ENTER_PX ? hovered : null
    })
  }, [])

  const applySwap = useCallback(
    (from: number, targetPhotoId: string) => {
      setPhotos((prev) => {
        const main = prev.find((item) => item.isMain)
        const list = [...prev.filter((item) => !item.isMain)]
        const to = list.findIndex((p) => p.id === targetPhotoId)
        if (to < 0 || from === to || from >= list.length) return prev
        ;[list[from], list[to]] = [list[to], list[from]]
        return main ? [main, ...list] : list
      })
    },
    [setPhotos],
  )

  /** Внешняя ячейка слота без transform — стабильная зона dragOver/drop (иначе transform даёт мигание dragLeave). */
  const getFilledSlotDropZoneHandlers = useCallback(
    (photoId: string) => ({
      onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        updateSwapPreviewAt(event.clientX, event.clientY)
      },
      onDrop: (event: React.DragEvent) => {
        event.preventDefault()
        const draggedId = draggedPhotoIdRef.current
        const from = dragSourceIndexRef.current
        if (!draggedId || from == null) {
          clearDragVisual()
          return
        }
        const to = nonMain.findIndex((p) => p.id === photoId)
        if (to < 0 || from === to) {
          clearDragVisual()
          return
        }
        applySwap(from, photoId)
        clearDragVisual()
      },
    }),
    [applySwap, nonMain, updateSwapPreviewAt],
  )

  const getPhotoDragSourceHandlers = useCallback(
    (photoId: string) => {
      if (reorderMode === 'pointer') {
        return {
          onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return
            pointerDownActiveRef.current = true
            pointerStartRef.current = { x: event.clientX, y: event.clientY }
            pointerHoldPhotoIdRef.current = photoId
            didTriggerHoldHapticRef.current = false
            clearHoldTimer()
            const el = event.currentTarget
            const pointerId = event.pointerId
            if (event.pointerType === 'touch') {
              const target = el
              const pid = pointerId
              const heldId = photoId
              queueMicrotask(() => {
                if (!pointerDownActiveRef.current || pointerHoldPhotoIdRef.current !== heldId) return
                try {
                  target.setPointerCapture(pid)
                  pendingPointerCaptureRef.current = { el: target, pointerId: pid }
                } catch {
                  pendingPointerCaptureRef.current = null
                }
              })
            }
            holdTimerRef.current = window.setTimeout(() => {
              if (!pointerDownActiveRef.current || pointerHoldPhotoIdRef.current !== photoId) return
              didTriggerHoldHapticRef.current = true
              triggerHaptic({ style: 'medium'})
              pointerReorderActiveRef.current = true
              draggedPhotoIdRef.current = photoId
              const nm = photosRef.current.filter((p) => !p.isMain)
              const fromIdx = nm.findIndex((p) => p.id === photoId)
              dragSourceIndexRef.current = fromIdx >= 0 ? fromIdx : null
              slotRectsSnapshotRef.current = [0, 1, 2, 3, 4].map(
                (idx) => slotCellRefs.current[idx]?.getBoundingClientRect() ?? new DOMRect(),
              )
              dragSourceElRef.current = el
              const snap = slotRectsSnapshotRef.current
              const from = dragSourceIndexRef.current
              const sr = from != null && from >= 0 ? snap[from] : null
              const w = sr?.width ?? 96
              const h = sr?.height ?? 96
              pointerFloatMetricsRef.current = { w, h }
              const elR = el.getBoundingClientRect()
              const st = pointerStartRef.current
              const cx = st?.x ?? (sr ? sr.left + sr.width / 2 : elR.left + elR.width / 2)
              const cy = st?.y ?? (sr ? sr.top + sr.height / 2 : elR.top + elR.height / 2)
              flushSync(() => {
                setPointerFollow({ x: cx, y: cy, w, h })
                setDraggingId(photoId)
                setSwapPreviewWithIndex(null)
              })
              if (!pendingPointerCaptureRef.current) {
                try {
                  el.setPointerCapture(pointerId)
                  pendingPointerCaptureRef.current = { el, pointerId }
                } catch {
                  pendingPointerCaptureRef.current = null
                }
              }
            }, HOLD_MS)
          },
          onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
            if (pointerReorderActiveRef.current) {
              event.preventDefault()
              if (pointerFloatMetricsRef.current == null) {
                const fromIdx = dragSourceIndexRef.current
                const sr =
                  fromIdx != null ? slotRectsSnapshotRef.current?.[fromIdx] : null
                pointerFloatMetricsRef.current = {
                  w: sr?.width ?? 96,
                  h: sr?.height ?? 96,
                }
              }
              const m = pointerFloatMetricsRef.current
              setPointerFollow({
                x: event.clientX,
                y: event.clientY,
                w: m.w,
                h: m.h,
              })
              updateSwapPreviewAt(event.clientX, event.clientY)
              return
            }
            if (holdTimerRef.current != null && pointerStartRef.current) {
              event.preventDefault()
              const dx = event.clientX - pointerStartRef.current.x
              const dy = event.clientY - pointerStartRef.current.y
              if (dx * dx + dy * dy > MOVE_CANCEL_HOLD_PX * MOVE_CANCEL_HOLD_PX) {
                clearHoldTimer()
                const p = pendingPointerCaptureRef.current
                if (p && !pointerReorderActiveRef.current) {
                  try {
                    if (
                      typeof p.el.hasPointerCapture === 'function' &&
                      p.el.hasPointerCapture(p.pointerId)
                    ) {
                      p.el.releasePointerCapture(p.pointerId)
                    }
                  } catch {
                    // ignore
                  }
                  pendingPointerCaptureRef.current = null
                }
              }
            }
          },
          onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
            const didReorder = pointerReorderActiveRef.current
            pointerDownActiveRef.current = false
            pointerHoldPhotoIdRef.current = null
            pointerStartRef.current = null
            clearHoldTimer()
            if (!didReorder && pendingPointerCaptureRef.current) {
              const { el: capEl, pointerId: capPid } = pendingPointerCaptureRef.current
              try {
                if (
                  typeof capEl.hasPointerCapture === 'function' &&
                  capEl.hasPointerCapture(capPid)
                ) {
                  capEl.releasePointerCapture(capPid)
                }
              } catch {
                // ignore
              }
              pendingPointerCaptureRef.current = null
            }
            if (didReorder) {
              event.preventDefault()
              const from = dragSourceIndexRef.current
              let hid = pickSlotIndexUnderPointStable(
                event.clientX,
                event.clientY,
                slotCellRefs.current,
              )
              const previewJ = swapPreviewSyncRef.current
              if ((hid == null || hid === from) && previewJ != null && previewJ !== from) {
                hid = previewJ
              }
              const nm = photosRef.current.filter((p) => !p.isMain)
              if (from != null && hid != null && hid !== from) {
                const targetPhoto = nm[hid]
                if (targetPhoto) applySwap(from, targetPhoto.id)
              }
              clearDragVisual()
            }
          },
          onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => {
            const didReorder = pointerReorderActiveRef.current
            pointerDownActiveRef.current = false
            pointerHoldPhotoIdRef.current = null
            pointerStartRef.current = null
            clearHoldTimer()
            if (!didReorder && pendingPointerCaptureRef.current) {
              const { el: capEl, pointerId: capPid } = pendingPointerCaptureRef.current
              try {
                if (
                  typeof capEl.hasPointerCapture === 'function' &&
                  capEl.hasPointerCapture(capPid)
                ) {
                  capEl.releasePointerCapture(capPid)
                }
              } catch {
                // ignore
              }
              pendingPointerCaptureRef.current = null
            }
            if (didReorder) {
              event.preventDefault()
              clearDragVisual()
            }
          },
        }
      }

      return {
        onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
          pointerStartRef.current = { x: event.clientX, y: event.clientY }
          didTriggerHoldHapticRef.current = false
          clearHoldTimer()
          holdTimerRef.current = window.setTimeout(() => {
            didTriggerHoldHapticRef.current = true
            triggerHaptic()
          }, HOLD_MS)
        },
        onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
          if (holdTimerRef.current != null && pointerStartRef.current) {
            const dx = event.clientX - pointerStartRef.current.x
            const dy = event.clientY - pointerStartRef.current.y
            if (dx * dx + dy * dy > MOVE_CANCEL_HOLD_PX * MOVE_CANCEL_HOLD_PX) {
              clearHoldTimer()
            }
          }
        },
        onPointerUp: () => {
          pointerStartRef.current = null
          clearHoldTimer()
        },
        onPointerLeave: () => {
          pointerStartRef.current = null
          clearHoldTimer()
        },
        onPointerCancel: () => {
          pointerStartRef.current = null
          clearHoldTimer()
        },
        onDragStart: (event: React.DragEvent<HTMLDivElement>) => {
          clearHoldTimer()
          if (!didTriggerHoldHapticRef.current) triggerHaptic()
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', photoId)
          draggedPhotoIdRef.current = photoId
          const srcIdx = nonMain.findIndex((p) => p.id === photoId)
          dragSourceIndexRef.current = srcIdx >= 0 ? srcIdx : null
          slotRectsSnapshotRef.current = [0, 1, 2, 3, 4].map(
            (idx) => slotCellRefs.current[idx]?.getBoundingClientRect() ?? new DOMRect(),
          )
          const sourceEl = event.currentTarget
          dragSourceElRef.current = sourceEl
          setDraggingId(photoId)
          setSwapPreviewWithIndex(null)
        },
        onDragEnd: () => {
          clearDragVisual()
        },
      }
    },
    [applySwap, nonMain, reorderMode, updateSwapPreviewAt],
  )

  const getEmptySlotDragHandlers = useCallback(
    () => ({
      onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
        if (draggedPhotoIdRef.current == null) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setSwapPreviewWithIndex(null)
      },
    }),
    [],
  )

  const stopDragFromButton = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  const previewTransition =
    'transition-[transform,opacity] duration-[1200ms] ease-[cubic-bezier(0.17,0.99,0.28,1)] will-change-transform'

  const pointerFloatPhoto =
    draggingId != null ? (photos.find((p) => p.id === draggingId) ?? null) : null

  return (
    <section className="mb-4">
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

      <div
        className={cn(
          'grid aspect-square w-full min-h-0 grid-cols-3 grid-rows-3 gap-2 overflow-visible',
          reorderMode === 'pointer' && pointerFollow != null && 'touch-none',
        )}
      >
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
          const slotIndex = i
          const n = i + 1
          return (
            <div
              key={photo?.id ?? `slot-${n}`}
              ref={setSlotRef(slotIndex)}
              data-slot-index={slotIndex}
              className={cn(
                'relative z-0 h-full min-h-0 min-w-0 overflow-visible',
                photo && reorderMode === 'pointer' && 'touch-none',
              )}
              {...(photo ? getFilledSlotDropZoneHandlers(photo.id) : getEmptySlotDragHandlers())}
            >
              {photo ? (
                <div
                  className={cn(
                    draggingId != null ? previewTransition : 'transition-none',
                    'h-full min-h-0',
                  )}
                  style={slotPreviewStyle(slotIndex)}
                >
                  <div
                    draggable={reorderMode === 'html5'}
                    className={cn(
                      'relative z-0 h-full min-h-0 cursor-grab select-none overflow-visible rounded-2xl active:cursor-grabbing',
                      reorderMode === 'pointer' && 'touch-none',
                      reorderMode === 'pointer' && draggingId === photo.id && 'opacity-0',
                    )}
                    {...getPhotoDragSourceHandlers(photo.id)}
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
          const slotIndex = i + 2
          const n = i + 3
          return (
            <div
              key={photo?.id ?? `slot-${n}`}
              ref={setSlotRef(slotIndex)}
              data-slot-index={slotIndex}
              className={cn(
                'relative z-0 h-full min-h-0 min-w-0 overflow-visible',
                photo && reorderMode === 'pointer' && 'touch-none',
              )}
              {...(photo ? getFilledSlotDropZoneHandlers(photo.id) : getEmptySlotDragHandlers())}
            >
              {photo ? (
                <div
                  className={cn(
                    draggingId != null ? previewTransition : 'transition-none',
                    'h-full min-h-0',
                  )}
                  style={slotPreviewStyle(slotIndex)}
                >
                  <div
                    draggable={reorderMode === 'html5'}
                    className={cn(
                      'relative z-0 h-full min-h-0 cursor-grab select-none overflow-visible rounded-2xl active:cursor-grabbing',
                      reorderMode === 'pointer' && 'touch-none',
                      reorderMode === 'pointer' && draggingId === photo.id && 'opacity-0',
                    )}
                    {...getPhotoDragSourceHandlers(photo.id)}
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

      {pointerFollow != null && reorderMode === 'pointer' && pointerFloatPhoto ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[85] overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
          style={{
            left: pointerFollow.x,
            top: pointerFollow.y,
            width: pointerFollow.w,
            height: pointerFollow.h,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Image
            src={pointerFloatPhoto.url}
            alt=""
            className="size-full object-cover"
          />
        </div>
      ) : null}

      <p className="mt-3 text-center text-[12px] font-light text-muted-foreground">
      Перетащите, чтобы изменить порядок
      </p>
    </section>
  )
}
