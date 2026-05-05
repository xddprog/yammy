'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Flame, X, Flag } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

import type { UseSuperLikeInteractionsResult } from '@/features/matches-feed/hooks/useSuperLikeInteractions'
import { SheetCard } from '@/features/matches-feed/ui/sheet-card'
import { Form, FormControl, FormField, FormItem } from '@/shared/ui/form/form'
import { Button, RadioGroup, RadioGroupItem } from '@/shared'

import { z } from 'zod'

import { REPORT_REASON_LABELS, reportFormSchema } from '../../lib/reportFormSchema'

interface MatchesCardContentProps {
  name: string
  age: number
  city: string
  bio: string
  actionIndicator: React.ReactNode
  onDislike: () => void
  onSuperLikeClick: () => void
  superLikeHandlers: UseSuperLikeInteractionsResult
}

const contentVariants = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
  transition: { duration: 0.2, ease: [0.22, 0.61, 0.36, 1] as const },
}

export const MatchesCardContent = ({
  name,
  age,
  city,
  bio,
  actionIndicator,
  onDislike,
  onSuperLikeClick,
  superLikeHandlers,
}: MatchesCardContentProps) => {
  const [isReportMode, setIsReportMode] = useState(false)
  const [isReportSubmitted, setIsReportSubmitted] = useState(false)

  const form = useForm<z.infer<typeof reportFormSchema>>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { reason: undefined },
  })

  const handleCloseReport = useCallback(() => {
    setIsReportMode(false)
    setIsReportSubmitted(false)
    form.reset()
  }, [form])

  const handleSubmitReport = useCallback((values: z.infer<typeof reportFormSchema>) => {
    if (values.reason) {
      console.log('Жалоба отправлена:', values.reason)
    }
    setIsReportSubmitted(true)
  }, [])

  const handleFlagClick = useCallback(() => {
    setIsReportMode(true)
  }, [])

  return (
    <motion.div className="mx-auto h-full w-full">
      <SheetCard
        className="h-full w-full"
        indicator={actionIndicator}
        contentClassName="overflow-y-auto px-7 pt-2 pb-4 no-scrollbar"
        footer={
          <div className="flex items-center justify-between px-7 pb-5 pt-3 bg-white z-20">
            {!isReportMode ? (
              <>
                <Button type="button" variant="black" size="icon-lg" onClick={onDislike}>
                  <X className="size-7" />
                </Button>
                <div className="relative space-x-2">
                  <Button
                    type="button"
                    variant="black"
                    size="icon-lg"
                    onPointerDown={superLikeHandlers.handleLikePointerDown}
                    onPointerUp={superLikeHandlers.handleLikePointerUp}
                    onPointerLeave={superLikeHandlers.handleLikePointerLeave}
                    className="group"
                  >
                    <Heart
                      className="size-7 text-white transition-colors group-active:text-primary group-active:fill-primary"
                      fill="transparent"
                    />
                  </Button>
                  <Button
                    type="button"
                    size="icon-lg"
                    onClick={onSuperLikeClick}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Flame className="size-7" strokeWidth={1.6} fill="white" />
                  </Button>
                </div>
              </>
            ) : isReportSubmitted ? (
              <Button
                type="button"
                variant="black"
                size="lg"
                className="w-full rounded-full"
                onClick={onDislike}
              >
                Продолжить
              </Button>
            ) : (
              <div className="w-full flex gap-2 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  onClick={handleCloseReport}
                  aria-label="Закрыть режим жалобы"
                >
                  <X className="size-7" />
                </Button>
                <div className="w-full">
                  <Button
                    type="submit"
                    form="report-form"
                    variant="black"
                    size="lg"
                    className="rounded-full w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!form.formState.isDirty}
                  >
                    Отправить
                  </Button>
                </div>
              </div>
            )}
          </div>
        }
      >
        <AnimatePresence mode="wait">
          {!isReportMode ? (
            <motion.div
              key="profile"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={contentVariants.transition}
              className="h-full"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[0]">{name}</h2>
                <button
                  type="button"
                  onClick={handleFlagClick}
                  className="p-1 -m-1 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer touch-manipulation"
                  aria-label="Пожаловаться"
                >
                  <Flag className="size-6 text-neutral-700" />
                </button>
              </div>
              <div className="space-y-3 text-sm leading-[1.4]">
                {bio && (
                  <p className="text-neutral-900">{bio}</p>
                )}
                <div className="mt-4 grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
                  <span className="text-neutral-400">возраст</span>
                  <span className="text-neutral-900">{age}</span>
                  <span className="text-neutral-400">город</span>
                  <span className="text-neutral-900">{city}</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={isReportSubmitted ? 'report-success' : 'report'}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={contentVariants.transition}
              className="h-full flex flex-col"
            >
              <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[0] mb-6">Жалоба</h2>
              {isReportSubmitted ? (
                <p className="text-neutral-900 text-sm leading-[1.5]">
                  Жалоба успешно отправлена, наша модерация рассмотрит её и примет необходимые меры!
                </p>
              ) : (
                <Form {...form}>
                  <form
                    id="report-form"
                    onSubmit={form.handleSubmit(handleSubmitReport)}
                    className="flex-1 flex flex-col"
                  >
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              value={field.value ?? ''}
                              onValueChange={field.onChange}
                              className="grid gap-3"
                            >
                              {(
                                Object.entries(REPORT_REASON_LABELS) as [
                                  keyof typeof REPORT_REASON_LABELS,
                                  string,
                                ][]
                              ).map(([value, label]) => (
                                <div key={value} className="flex items-center gap-3">
                                  <RadioGroupItem value={value} id={`report-${value}`} />
                                  <label
                                    htmlFor={`report-${value}`}
                                    className="font-light text-zinc-400 cursor-pointer select-none flex-1"
                                  >
                                    {label}
                                  </label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </SheetCard>
    </motion.div>
  )
}
