export interface MockChat {
  id: string
  name: string
  lastMessage: string
  avatar: string
  timestamp?: string
  unreadCount: number
  online?: boolean
  isTyping?: boolean
  hasPhotoPreview?: boolean
  isMutedUnreadDot?: boolean
}

export const MOCK_CHATS: MockChat[] = [
  {
    id: '1',
    name: 'Lucy, 22',
    lastMessage: 'Say hi!',
    avatar: '/images/photo_2025-12-23_22-41-09.jpg',
    unreadCount: 3,
    online: true,
  },
  {
    id: '2',
    name: 'Margareth, 21',
    lastMessage: 'Photo',
    avatar: '/images/photo_2025-12-16_22-32-35.jpg',
    unreadCount: 0,
    hasPhotoPreview: true,
    isMutedUnreadDot: true,
  },
  {
    id: '3',
    name: 'Emily, 27',
    lastMessage: 'Hey, how are you?',
    avatar: '/images/photo_2025-04-10_00-42-15.jpg',
    unreadCount: 0,
    isMutedUnreadDot: true,
  },
  {
    id: '4',
    name: 'Alissia, 20',
    lastMessage: 'Is typing...',
    avatar: '/images/i.webp',
    unreadCount: 1,
    isTyping: true,
  },
  {
    id: '5',
    name: 'Stephanie, 19',
    lastMessage: "It's me with my friends",
    avatar: '/images/photo_2025-12-23_22-41-09.jpg',
    unreadCount: 0,
    hasPhotoPreview: true,
  },
  {
    id: '6',
    name: 'Joanna, 24',
    lastMessage: 'Have a great evening',
    avatar: '/images/photo_2025-12-16_22-32-35.jpg',
    unreadCount: 2,
  },
  {
    id: '7',
    name: 'Emma, 23',
    lastMessage: 'See you tomorrow',
    avatar: '/images/photo_2025-04-10_00-42-15.jpg',
    unreadCount: 0,
  },
]

export const MOCK_CHAT_STORIES = [
  { id: 'create', avatar: null },
  { id: 's1', avatar: '/images/photo_2025-12-23_22-41-09.jpg' },
  { id: 's2', avatar: '/images/photo_2025-12-16_22-32-35.jpg' },
  { id: 's3', avatar: '/images/photo_2025-04-10_00-42-15.jpg' },
  { id: 's4', avatar: '/images/i.webp' },
  { id: 's5', avatar: '/images/photo_2025-12-23_22-41-09.jpg' },
]
