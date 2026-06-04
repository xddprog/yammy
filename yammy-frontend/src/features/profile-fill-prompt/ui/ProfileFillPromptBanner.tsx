import type { JSX } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import { Button, cn } from '@/shared'

type ProfileFillPromptBannerProps = {
  open: boolean
  onDismiss: () => void
  onFill: () => void
}

/**
 * Фон без fade: opacity-анимация на backdrop-blur в WebKit/Safari даёт «сначала затемнение, потом blur».
 * Как в OverlayProvider по виду, но появление фона мгновенное.
 */
const backdropClassName =
  'pointer-events-auto absolute inset-0 bg-black/50 backdrop-blur-sm [transform:translateZ(0)]'

const feedCardFrameClassName = cn(
  'pointer-events-none absolute inset-x-0 left-1/2 flex w-full max-w-md -translate-x-1/2 items-center justify-center px-4',
  'top-[95px]',
  'bottom-[calc(5.25rem+2.25rem+env(safe-area-inset-bottom,0px))]',
)

const overlayEase = [0.22, 0.61, 0.36, 1] as const

export function ProfileFillPromptBanner({
  open,
  onDismiss,
  onFill,
}: ProfileFillPromptBannerProps): JSX.Element | null {
  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          key="profile-fill-prompt"
          className="pointer-events-none fixed inset-0 z-1000"
          role="presentation"
        >
          <button
            type="button"
            className={backdropClassName}
            aria-label="Закрыть"
            onClick={onDismiss}
          />
          <div className={feedCardFrameClassName}>
            <motion.div
              role="dialog"
              aria-label="Дополните профиль"
              className="pointer-events-auto relative z-10 w-full max-w-[340px] rounded-[24px] bg-white px-5 pb-4 pt-4 shadow-2xl"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.35, ease: overlayEase }}
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-left text-[15px] font-light leading-snug text-[#2a2a2a]">
                Расскажи о себе чуть подробнее, заполнив профиль - так мы сможем подбирать людей еще лучше!
              </p>
              <div className="mt-4 flex flex-row items-center gap-2">
                <button
                  type="button"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#2a2a2a]/70 transition-colors hover:bg-black/5 active:scale-95"
                  aria-label="Закрыть"
                  onClick={onDismiss}
                >
                  <X className="size-5" strokeWidth={1.5} />
                </button>
                <Button type="button" className="min-w-0 flex-1" onClick={onFill}>
                  Заполнить
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
