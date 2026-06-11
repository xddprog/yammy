import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert } from 'lucide-react'
import type { JSX, ReactNode } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { setErrorToastListener } from './errorToastBus'

type ToastItem = { id: number; message: string }

/** Время удержания в полной непрозрачности и длительность затухания зависят от длины текста. */
export function errorToastTiming(message: string): { displayMs: number; fadeMs: number } {
  const len = message.length
  const displayMs = Math.min(12_000, Math.max(2_200, 1_600 + len * 48))
  const fadeMs = Math.min(1_100, Math.max(320, 220 + len * 14))
  return { displayMs, fadeMs }
}

const ENTER_MS = 380

export const ErrorToastProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [queue, setQueue] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const enqueue = useCallback((message: string) => {
    idRef.current += 1
    const id = idRef.current
    // Одна плашка: новая ошибка заменяет текущую (ещё на экране), AnimatePresence по key даёт выход + вход.
    setQueue([{ id, message }])
  }, [])

  const dequeue = useCallback(() => {
    setQueue((q) => q.slice(1))
  }, [])

  useLayoutEffect(() => {
    setErrorToastListener(enqueue)
    return () => {
      setErrorToastListener(null)
    }
  }, [enqueue])

  const active = queue[0] ?? null

  const portal =
    typeof document !== 'undefined'
      ? createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 top-0 z-[10000] flex justify-center"
            style={{ isolation: 'isolate' }}
            aria-live="assertive"
          >
            <div className="pointer-events-auto w-full max-w-md px-4 pt-[85px]">
              <AnimatePresence mode="wait">
                {active != null ? (
                  <ErrorToastStrip key={active.id} message={active.message} onDone={dequeue} />
                ) : null}
              </AnimatePresence>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {children}
      {portal}
    </>
  )
}

const ErrorToastStrip = ({
  message,
  onDone,
}: {
  message: string
  onDone: () => void
}): JSX.Element => {
  const { displayMs, fadeMs } = errorToastTiming(message)
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const doneRef = useRef(false)

  useEffect(() => {
    setPhase('in')
    doneRef.current = false
  }, [message])

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }, [onDone])

  useEffect(() => {
    const fadeAt = ENTER_MS + displayMs
    const removeAt = fadeAt + fadeMs
    const tFade = window.setTimeout(() => setPhase('out'), fadeAt)
    const tDone = window.setTimeout(finish, removeAt)
    return () => {
      window.clearTimeout(tFade)
      window.clearTimeout(tDone)
    }
  }, [displayMs, fadeMs, finish, message])

  return (
    <motion.div
      initial={{ opacity: 0, y: -18 }}
      animate={
        phase === 'in'
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: -10 }
      }
      transition={
        phase === 'in'
          ? { duration: 0.34, ease: [0.22, 0.61, 0.36, 1] }
          : { duration: fadeMs / 1000, ease: [0.4, 0, 1, 1] }
      }
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="flex w-full items-center gap-1 rounded-[28px] border border-neutral-200 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
    >
      <CircleAlert className="size-6 shrink-0 text-black" aria-hidden />
      <p className="min-w-0 flex-1 text-left text-[14px] leading-snug text-black font-[200]">{message}</p>
    </motion.div>
  )
}
