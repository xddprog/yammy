'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Flame, X, MapPin } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  filters?: Record<string, Record<string, string[]>>
  traits?: Record<string, Record<string, string[]>>
  reportTriggerKey?: number
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
  filters,
  traits,
  reportTriggerKey = 0,
  actionIndicator,
  onDislike,
  onSuperLikeClick,
  superLikeHandlers,
}: MatchesCardContentProps) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isReportSubmitted, setIsReportSubmitted] = useState(false)

  const form = useForm<z.infer<typeof reportFormSchema>>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { reason: undefined },
  })

  const handleCloseReport = useCallback(() => {
    setIsReportModalOpen(false)
    setIsReportSubmitted(false)
    form.reset()
  }, [form])

  const handleSubmitReport = useCallback((values: z.infer<typeof reportFormSchema>) => {
    if (values.reason) {
      console.log('Жалоба отправлена:', values.reason)
    }
    setIsReportSubmitted(true)
  }, [])

  useEffect(() => {
    if (reportTriggerKey > 0) {
      setIsReportModalOpen(true)
      setIsReportSubmitted(false)
      form.reset()
    }
  }, [reportTriggerKey, form])

  const groupedTraits = useMemo(() => {
    const source = traits ?? filters
    if (source == null) return []

    return Object.entries(source)
      .map(([groupTitle, subgroups]) => {
        const values = Array.from(
          new Set(
            Object.values(subgroups)
              .flat()
              .map((value) => value?.trim())
              .filter((value): value is string => value != null && value.length > 0),
          ),
        )

        return { groupTitle, values }
      })
      .filter((group) => group.values.length > 0)
  }, [traits, filters])

  return (
    <motion.div className="relative mx-auto w-full">
      <SheetCard
        className="w-full rounded-none overflow-visible bg-background text-white"
        indicator={actionIndicator}
        contentClassName="px-6 pt-4 pb-32"
        footer={
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-background px-7 pb-5 pt-3">
            <div className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-center gap-[12%] px-4">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={onDislike}
                className="h-14 w-14 rounded-full !bg-[#BC97FF]/35 !text-white transition-colors !hover:bg-[#BC97FF]/55 !hover:text-white !active:bg-[#BC97FF] !focus-visible:ring-[#BC97FF]/60 !focus-visible:border-transparent"
              >
                <X className="size-7" strokeWidth={1.6} />
              </Button>
              <Button
                type="button"
                variant="default"
                size="icon-2xl"
                onPointerDown={superLikeHandlers.handleLikePointerDown}
                onPointerUp={superLikeHandlers.handleLikePointerUp}
                onPointerLeave={superLikeHandlers.handleLikePointerLeave}
                className="h-[72px] w-[72px] rounded-full bg-primary hover:bg-primary/90"
              >
                <Heart className="size-8 text-white" fill="white" strokeWidth={1.4} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={onSuperLikeClick}
                className="h-14 w-14 rounded-full !bg-[#BC97FF]/35 !text-white transition-colors !hover:bg-[#BC97FF]/55 !hover:text-white !active:bg-[#BC97FF] !focus-visible:ring-[#BC97FF]/60 !focus-visible:border-transparent"
              >
                <Flame className="size-7" strokeWidth={1.4} fill="white" />
              </Button>
            </div>
          </div>
        }
      >
        <motion.div
          key="profile"
          variants={contentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={contentVariants.transition}
          className="min-h-0"
        >
          <div className="mb-1 flex items-start justify-between gap-3">
            <h2 className="text-[28px] font-medium leading-[120%] tracking-[0] text-white">
              {name}, {age}
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-[1.4]">
            <div className="flex items-center gap-1 text-[15px] font-thin leading-[120%] tracking-[0] text-white/85">
              <MapPin size={17} strokeWidth={1.2} aria-hidden />
              {city}
            </div>
            {bio && <p className="text-[15px] font-thin leading-[120%] tracking-[0] text-white/85">{bio}</p>}
            {groupedTraits.map((group) => (
              <div key={group.groupTitle} className="mt-4">
                <h3 className="mb-2 text-[13px] font-semibold tracking-wide text-white/75 uppercase">
                  {group.groupTitle}
                </h3>
                <div className="-mx-6 overflow-x-scroll px-6 no-scrollbar touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div className="inline-flex w-max gap-1.5 whitespace-nowrap">
                    {group.values.map((value) => (
                      <span
                        key={`${group.groupTitle}:${value}`}
                        className="rounded-[16px] bg-accent px-6 py-2 text-[16px] font-semibold text-accent-foreground whitespace-nowrap"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </SheetCard>

      <AnimatePresence>
        {isReportModalOpen ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-[420px] rounded-[28px] bg-background p-6 text-white"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[0] text-white">Жалоба</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  onClick={handleCloseReport}
                  aria-label="Закрыть режим жалобы"
                  className="h-11 w-11 rounded-full !bg-[#BC97FF]/30 !text-white !hover:bg-[#BC97FF]/45 !hover:text-white !active:bg-[#BC97FF]/55 !focus-visible:ring-[#BC97FF]/60 !focus-visible:border-transparent"
                >
                  <X className="size-6" />
                </Button>
              </div>

              {isReportSubmitted ? (
                <div className="space-y-5">
                  <p className="text-white/90 text-sm leading-[1.5]">
                    Жалоба успешно отправлена, наша модерация рассмотрит ее и примет необходимые меры.
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    className="w-full rounded-full bg-[#BC97FF] text-[#2F1E66] hover:bg-[#C7A8FF]"
                    onClick={handleCloseReport}
                  >
                    Готово
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form id="report-form" onSubmit={form.handleSubmit(handleSubmitReport)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup value={field.value ?? ''} onValueChange={field.onChange} className="grid gap-3">
                              {(
                                Object.entries(REPORT_REASON_LABELS) as [
                                  keyof typeof REPORT_REASON_LABELS,
                                  string,
                                ][]
                              ).map(([value, label]) => (
                                <div key={value} className="flex items-center gap-3">
                                  <RadioGroupItem
                                    value={value}
                                    id={`report-${value}`}
                                    className="data-[state=checked]:border-[#BC97FF] focus-visible:border-[#BC97FF] focus-visible:ring-[#BC97FF]/40 [&_[data-slot=radio-group-indicator]>span]:bg-[#BC97FF]"
                                  />
                                  <label
                                    htmlFor={`report-${value}`}
                                    className="font-light text-white/80 cursor-pointer select-none flex-1"
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

                    <Button
                      type="submit"
                      variant="default"
                      size="lg"
                      className="w-full rounded-full !bg-[#BC97FF] !text-[#2F1E66] transition-colors !hover:bg-[#BC97FF] !active:bg-[#BC97FF] disabled:!bg-[#BC97FF] disabled:opacity-100 disabled:cursor-not-allowed"
                      disabled={!form.formState.isDirty}
                    >
                      Отправить
                    </Button>
                  </form>
                </Form>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
