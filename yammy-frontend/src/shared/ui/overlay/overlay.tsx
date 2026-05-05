import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/shared'

type OverlayId = string

type OverlayOptions = {
  content: (close: () => void) => ReactNode
  backdropClassName?: string
  panelClassName?: string
  disableBackdropClick?: boolean
  closeOnEsc?: boolean
}

type OverlayInstance = {
  id: OverlayId
  options: OverlayOptions
}

type OverlayContextValue = {
  open: (options: OverlayOptions) => OverlayId
  close: (id?: OverlayId) => void
  closeAll: () => void
}

const OverlayContext = createContext<OverlayContextValue | null>(null)

let overlayIdCounter = 0

const createOverlayId = (): OverlayId => {
  overlayIdCounter += 1
  return `overlay-${overlayIdCounter}`
}

export const OverlayProvider = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const [stack, setStack] = useState<OverlayInstance[]>([])

  const open = useCallback((options: OverlayOptions): OverlayId => {
    const id = createOverlayId()
    setStack((prev) => [...prev, { id, options }])
    return id
  }, [])

  const close = useCallback((id?: OverlayId) => {
    setStack((prev) => {
      if (prev.length === 0) return prev
      if (id == null) {
        return prev.slice(0, -1)
      }
      return prev.filter((instance) => instance.id !== id)
    })
  }, [])

  const closeAll = useCallback(() => {
    setStack([])
  }, [])

  useEffect(() => {
    if (stack.length === 0) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      const top = stack[stack.length - 1]
      if (top?.options.closeOnEsc === false) return

      close(top.id)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [stack, close])

  const value = useMemo<OverlayContextValue>(
    () => ({
      open,
      close,
      closeAll,
    }),
    [open, close, closeAll],
  )

  if (typeof document === 'undefined') {
    return <>{children}</>
  }

  return (
    <OverlayContext.Provider value={value}>
      {children}
      {createPortal(
        <AnimatePresence>
          {stack.map(({ id, options }) => (
            <motion.div
              key={id}
              className="fixed inset-0 z-1000 flex items-end justify-center pointer-events-none"
              initial="closed"
              animate="open"
              exit="closed"
            >
              <motion.div
                className={cn(
                  'absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto',
                  options.backdropClassName,
                )}
                variants={{
                  open: {
                    opacity: 1,
                    transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] },
                  },
                  closed: {
                    opacity: 0,
                    transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] },
                  },
                }}
                onClick={options.disableBackdropClick ? undefined : () => close(id)}
              />

              <motion.div
                className={cn(
                  'relative w-full max-w-md h-full pointer-events-auto',
                  options.panelClassName,
                )}
                variants={{
                  open: {
                    y: 0,
                    transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] },
                  },
                  closed: {
                    y: '100%',
                    opacity: 1,
                    transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] },
                  },
                }}
                onClick={(event) => event.stopPropagation()}
              >
                {options.content(() => close(id))}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>,
        document.body,
      )}
    </OverlayContext.Provider>
  )
}

export const useOverlay = (): OverlayContextValue => {
  const context = useContext(OverlayContext)

  if (context == null) {
    throw new Error('useOverlay must be used within an OverlayProvider')
  }

  return context
}
