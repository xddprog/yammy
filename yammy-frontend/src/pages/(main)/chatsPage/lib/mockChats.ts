export interface MockChat {
  id: string
  name: string
  lastMessage: string
  avatar: string
  timestamp: string
  unreadCount: number
  online?: boolean
}

export const MOCK_CHATS: MockChat[] = [
  {
    id: '1',
    name: 'Анна',
    lastMessage: 'Привет! Как дела?',
    avatar: '/images/photo_2025-12-23_22-41-09.jpg',
    timestamp: '15:42',
    unreadCount: 2,
    online: true,
  },
  {
    id: '2',
    name: 'Мария',
    lastMessage: 'Пойдем завтра в кино?',
    avatar: '/images/photo_2025-12-16_22-32-35.jpg',
    timestamp: 'Вчера',
    unreadCount: 0,
    online: false,
  },
  {
    id: '3',
    name: 'Елена',
    lastMessage: 'Ха-ха, очень смешно!',
    avatar: '/images/photo_2025-04-10_00-42-15.jpg',
    timestamp: 'Чт',
    unreadCount: 0,
    online: true,
  },
  {
    id: '4',
    name: 'Дарья',
    lastMessage: 'Я уже на месте',
    avatar: '/images/i.webp',
    timestamp: 'Пн',
    unreadCount: 5,
    online: false,
  },
  {
    id: '5',
    name: 'София',
    lastMessage: 'Скинь фотки плиз',
    avatar: '/images/photo_2025-12-23_22-41-09.jpg',
    timestamp: '10.03',
    unreadCount: 0,
    online: false,
  },
]
