import { z } from 'zod'

export const REPORT_REASONS = ['rude', 'spam', 'adult', 'fake', 'other'] as const
export const REPORT_REASON_LABELS: Record<(typeof REPORT_REASONS)[number], string> = {
  rude: 'Грубо',
  spam: 'Спам',
  adult: 'Контент 18+',
  fake: 'Фейк',
  other: 'Другое',
}

export const reportFormSchema = z
  .object({
    reason: z.enum(REPORT_REASONS).optional(),
  })
  .refine((data) => data.reason !== undefined, {
    message: 'Выберите причину жалобы',
    path: ['reason'],
  })

export type ReportFormValues = z.output<typeof reportFormSchema>
