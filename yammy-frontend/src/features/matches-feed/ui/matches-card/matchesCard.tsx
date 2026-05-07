'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { Flag, Flame, Heart, UserX, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { UseSuperLikeInteractionsResult } from '@/features/matches-feed/hooks/useSuperLikeInteractions'
import { SheetCard } from '@/features/matches-feed/ui/sheet-card'
import { Button, RadioGroup, RadioGroupItem } from '@/shared'
import { Form, FormControl, FormField, FormItem } from '@/shared/ui/form/form'

import { REPORT_REASON_LABELS, reportFormSchema } from '../../lib/reportFormSchema'

type UserFilters = Record<string, Record<string, string[]>>

interface MatchesCardContentProps {
  name: string
  age: number
  city: string
  bio: string
  relationshipGoal?: string
  jobSphere?: string
  educationDetails?: string
  educationLevel?: string
  job?: string
  userFilters?: UserFilters
  fromChat?: boolean
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
  relationshipGoal,
  jobSphere,
  educationDetails,
  educationLevel,
  job,
  userFilters,
  fromChat = false,
  actionIndicator,
  onDislike,
  onSuperLikeClick,
  superLikeHandlers,
}: MatchesCardContentProps) => {
  const [isReportMode, setIsReportMode] = useState(false)
  const [isReportSubmitted, setIsReportSubmitted] = useState(false)
  const [isBlockMode, setIsBlockMode] = useState(false)
  const [isBlockSubmitted, setIsBlockSubmitted] = useState(false)

  const form = useForm<z.infer<typeof reportFormSchema>>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { reason: undefined },
  })

  const handleCloseReport = useCallback(() => {
    setIsReportMode(false)
    setIsReportSubmitted(false)
    form.reset()
  }, [form])

  const handleOpenBlock = useCallback(() => {
    setIsBlockMode(true)
  }, [])

  const handleCloseBlock = useCallback(() => {
    setIsBlockMode(false)
    setIsBlockSubmitted(false)
  }, [])

  const handleSubmitBlock = useCallback(() => {
    setIsBlockSubmitted(true)
  }, [])

  const handleSubmitReport = useCallback((values: z.infer<typeof reportFormSchema>) => {
    if (values.reason) {
      console.log('Жалоба отправлена:', values.reason)
    }
    setIsReportSubmitted(true)
  }, [])

  const handleFlagClick = useCallback(() => {
    setIsReportMode(true)
  }, [])

  const relationshipGoalLabelMap: Record<string, string> = {
    serious: 'Серьезные отношения',
    friendship: 'Дружбу',
    dating: 'Знакомства',
    relationship: 'Отношения',
  }

  const hasDisplayValue = (value: string | null | undefined): boolean => {
    if (value == null) return false
    const normalized = value.trim().toLowerCase()
    if (!normalized) return false
    return normalized !== 'не указано' && normalized !== 'null' && normalized !== 'undefined'
  }

  const mainInfoRows = [
    {
      label: 'ищет',
      value: relationshipGoalLabelMap[relationshipGoal ?? ''] ?? relationshipGoal ?? '',
    },
    { label: 'город', value: city },
    { label: 'образование', value: educationDetails ?? educationLevel ?? '' },
    { label: 'работа', value: job ?? '' },
    { label: 'сфера работы', value: jobSphere ?? '' },
  ].filter((row) => hasDisplayValue(row.value))

  const groupedFilters = Object.entries(userFilters ?? {}).filter(([, subgroups]) =>
    Object.values(subgroups).some((values) => values.length > 0),
  )

  return (
    <motion.div className="mx-auto h-full w-full">
      <SheetCard
        className="h-full w-full"
        indicator={actionIndicator}
        contentClassName="overflow-y-auto px-7 pt-2 pb-4 no-scrollbar"
        footer={
          <div className="flex items-bottom justify-between px-7 pb-5 pt-3 bg-white z-20">
            {isBlockMode ? (
              isBlockSubmitted ? (
                <Button
                  type="button"
                  variant="black"
                  size="lg"
                  className="w-full rounded-full"
                  onClick={onDislike}
                >
                  Закрыть
                </Button>
              ) : (
                <div className="w-full flex gap-2 items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    onClick={handleCloseBlock}
                    aria-label="Отменить блокировку"
                  >
                    <X className="size-7" strokeWidth={1.4} />
                  </Button>
                  <div className="w-full">
                    <Button
                      type="button"
                      variant="black"
                      size="lg"
                      className="rounded-full w-full"
                      onClick={handleSubmitBlock}
                    >
                      Подтвердить
                    </Button>
                  </div>
                </div>
              )
            ) : !isReportMode ? (
              fromChat ? (
                <Button
                  type="button"
                  variant="black"
                  size="lg"
                  className="w-full rounded-full"
                  onClick={handleOpenBlock}
                >
                  <UserX className="mr-1 size-5" strokeWidth={1.8} />
                  Заблокировать
                </Button>
              ) : (
                <>
                  <Button type="button" variant="black" size="icon-lg" onClick={onDislike}>
                    <X className="size-7" strokeWidth={1.4} />
                  </Button>
                  <div className="relative space-x-2">
                    <Button
                      type="button"
                      variant="black"
                      size="icon-lg"
                      onPointerDown={superLikeHandlers.handleLikePointerDown}
                      onPointerUp={superLikeHandlers.handleLikePointerUp}
                      onPointerLeave={superLikeHandlers.handleLikePointerLeave}
                      className="group active:scale-95 transition-transform duration-200"
                    >
                      <Heart
                        className="size-7 text-white transition-colors group-active:text-[#FF6BA4] group-active:fill-[#FF6BA4]"
                        fill="transparent"
                        strokeWidth={1.4}
                      />
                    </Button>
                    <Button
                      type="button"
                      size="icon-lg"
                      onClick={onSuperLikeClick}
                      className="bg-[#FF6BA4] hover:bg-[#FF6BA4]/90 active:scale-95 transition-transform duration-200"
                    >
                      <Flame className="size-7" strokeWidth={1.4} fill="white" />
                    </Button>
                  </div>
                </>
              )
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
                  <X className="size-7" strokeWidth={1.4} />
                </Button>
                <div className="w-full">
                  <Button
                    type="submit"
                    variant="black"
                    form="report-form"
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
          {isBlockMode ? (
            <motion.div
              key={isBlockSubmitted ? 'block-success' : 'block'}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={contentVariants.transition}
              className="h-full flex flex-col"
            >
              <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[0] mb-6">Блокировка</h2>
              {isBlockSubmitted ? (
                <p className="text-neutral-900 text-sm leading-[1.5]">
                  Пользователь заблокирован. Чат и мэтч удалены.
                </p>
              ) : (
                <p className="text-neutral-900 text-sm leading-[1.5]">
                  Вы уверены, что хотите заблокировать пользователя? При блокировке удаляются чат и мэтч. Это действие нельзя будет отменить.
                </p>
              )}
            </motion.div>
          ) : !isReportMode ? (
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
                  className="p-1 -m-1 rounded-full transition-colors cursor-pointer touch-manipulation active:scale-95"
                  aria-label="Пожаловаться"
                >
                  <Flag className="size-6 text-neutral-700" strokeWidth={1.5} />
                </button>
              </div>
              <div className="space-y-3 text-[16px] leading-[1.4]">
                {bio && <p className="text-neutral-900">{bio}</p>}

                <div className="mt-4 space-y-2 text-[16px] leading-[1.25]">
                  <div className="flex items-center justify-between gap-6">
                    <span className="font-[160] text-neutral-400">возраст</span>
                    <div className="max-w-[62%] overflow-x-auto whitespace-nowrap text-right text-neutral-900 no-scrollbar">
                      {age}
                    </div>
                  </div>

                  {mainInfoRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-6">
                      <span className="font-[160] text-neutral-400">{row.label}</span>
                      <div className="max-w-[62%] overflow-x-auto whitespace-nowrap text-right text-neutral-900 no-scrollbar">
                        {row.value}
                      </div>
                    </div>
                  ))}

                  {groupedFilters.map(([groupName, subgroups]) => (
                    <div key={groupName} className="mt-4 space-y-2 border-t border-[#14141426] pt-4">
                      <p className="mb-2 text-[16px] text-neutral-400">
                        {groupName}
                      </p>
                      {Object.entries(subgroups).map(([subcategoryName, values]) => {
                        if (values.length === 0) return null
                        return (
                          <div key={subcategoryName} className="flex items-center justify-between gap-6">
                            <span className="font-[160] text-[16px] text-neutral-400">
                              {subcategoryName.toLowerCase()}
                            </span>
                            <div className="max-w-[62%] overflow-x-auto whitespace-nowrap text-right text-neutral-900 no-scrollbar">
                              {values.join(', ')}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
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
