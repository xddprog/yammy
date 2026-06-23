export type ChatMessage = {
  id: string
  text?: string
  images?: string[]
  senderId: 'me' | 'other'
  timestamp: string
  createdAt: string
  updatedAt?: string | null
  isRead?: boolean
  isEdited?: boolean
  isDeleted?: boolean
  uploadStatus?: 'uploading'
  replyToId?: string
  replyToText?: string
  replyToName?: string
}
