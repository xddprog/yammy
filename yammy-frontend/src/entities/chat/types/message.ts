export type ChatMessage = {
  id: string
  text?: string
  images?: string[]
  senderId: 'me' | 'other'
  timestamp: string
  replyToId?: string
  replyToText?: string
  replyToName?: string
}
