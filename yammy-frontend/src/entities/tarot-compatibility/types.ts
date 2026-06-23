export type TarotCompatibilityJobStatus = 'searching' | 'ready' | 'failed'

export type TarotCardPosition = 'past' | 'present' | 'future'

export interface TarotCard {
  name: string
  position: TarotCardPosition
  meaning: string
}

export interface TarotCompatibilityResult {
  summary: string
  cards: TarotCard[]
  reading_text: string
}

export interface TarotCompatibilityJob {
  id: string
  partnerUserId: string
  status: TarotCompatibilityJobStatus
  result: TarotCompatibilityResult | null
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
}

export interface TarotCompatibilityWithPartner {
  item: TarotCompatibilityJob | null
  remainingToday: number
}

export interface TarotCompatibilityCreatePayload {
  partner_user_id: string
  force_new?: boolean
}
