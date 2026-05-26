import { z } from 'zod'

// Коды должны совпадать с backend enum `ReportReasonEnum`
export const REPORT_REASONS = [
  'spam',
  'inappropriate_content',
  'harassment',
  'fake_profile',
  'other',
] as const

export const REPORT_REASON_LABELS: Record<(typeof REPORT_REASONS)[number], string> = {
  spam: 'Спам',
  inappropriate_content: 'Контент 18+',
  harassment: 'Грубо',
  fake_profile: 'Фейк',
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
