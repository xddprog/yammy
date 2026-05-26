export { fetchChatsList } from './api/chatService'
export { PresenceProvider } from './context/PresenceProvider'
export { useChatWebSocket } from './hooks/useChatWebSocket'
export { flattenChatsPages, useChatsList } from './hooks/useChatsList'
export { usePresence, usePresenceSubscription } from './hooks/usePresence'
export { CHAT_WS_EVENTS } from './lib/chatWsEvents'
export { PRESENCE_WS_EVENTS } from './lib/presenceWsEvents'
export { chatsQueryKeys } from './lib/chatsQueryKeys'
export { formatLastSeenLabel } from './lib/formatLastSeen'
export type { ChatListItem, ChatListItemDto } from './types/types'
export type { ChatMessage } from './types/message'
export type { ChatMessagesPageData, ChatOpenData, ChatWsEnvelope } from './types/chatSocket'
export type {
  PresenceErrorData,
  PresencePeerStateDto,
  PresenceSnapshotData,
  PresenceSubscribePayload,
  PresenceUpdateData,
  PresenceWsEnvelope,
} from './types/presenceSocket'
