export interface MockMessage {
  id: string
  text?: string
  images?: string[]
  senderId: string // 'me' or 'other'
  timestamp: string
  replyToId?: string
  replyToText?: string
  replyToName?: string
}

export const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  '1': [
    { id: 'm1', text: 'Привет! Как дела?', senderId: 'other', timestamp: '15:40' },
    { id: 'm2', text: 'Привет! Всё отлично, как у тебя?', senderId: 'me', timestamp: '15:41' },
    { id: 'm3', text: 'Тоже хорошо) Чем занимаешься?', senderId: 'other', timestamp: '15:42' },
  ],
  '2': [{ id: 'm4', text: 'Пойдем завтра в кино?', senderId: 'other', timestamp: 'Вчера' }],
}
