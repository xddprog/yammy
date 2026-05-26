export const CHAT_WS_EVENTS = {
  ERROR: 'error',
  OPEN_CHAT: 'open_chat',
  MESSAGES: 'messages',
  MESSAGE: 'message',
  READ: 'read',
  DELETE: 'delete',
  EDIT: 'edit',
  TYPING: 'typing',
} as const

export type ChatWsEvent = (typeof CHAT_WS_EVENTS)[keyof typeof CHAT_WS_EVENTS]
