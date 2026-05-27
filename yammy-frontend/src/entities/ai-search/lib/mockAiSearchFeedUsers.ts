import type { AiSearchJobResults } from '../types'
import type { UserSearchApiUser } from '@/entities/user/types/types'

const MOCK_PHOTOS = [
  '/images/photo_2025-12-23_22-41-09.jpg',
  '/images/photo_2025-12-16_22-32-35.jpg',
  '/images/photo_2025-04-10_00-42-15.jpg',
]

const HIGHLIGHT_SAMPLES = [
  'Вы оба играете в CS — будет весело',
  'Похожий ритм жизни и чувство юмора',
  'Совпадают цели знакомства',
  'Общие интересы в музыке и прогулках',
  'Подходит по возрасту и городу',
  'Активный образ жизни — как у вас',
]

export const MOCK_AI_SEARCH_FEED_USERS: UserSearchApiUser[] = [
  {
    user_id: 'ai-mock-1',
    username: 'anna_ai',
    name: 'Анна',
    age: 24,
    gender: 'Женский',
    relationship_goal: 'relationship',
    bio: 'Люблю прогулки и кино',
    city: 'Санкт-Петербург',
    job: 'Дизайнер',
    job_sphere: 'creative',
    education_level: 'bachelor',
    education_details: '',
    photos: [MOCK_PHOTOS[0], MOCK_PHOTOS[1]],
    filter_option_ids: [],
    match_percentage: 92,
  },
  {
    user_id: 'ai-mock-2',
    username: 'maria_ai',
    name: 'Мария',
    age: 26,
    gender: 'Женский',
    relationship_goal: 'dating',
    bio: 'Йога и путешествия',
    city: 'Москва',
    job: 'Маркетолог',
    job_sphere: 'marketing',
    education_level: 'master',
    education_details: '',
    photos: [MOCK_PHOTOS[1], MOCK_PHOTOS[2]],
    filter_option_ids: [],
    match_percentage: 88,
  },
  {
    user_id: 'ai-mock-3',
    username: 'kate_ai',
    name: 'Екатерина',
    age: 23,
    gender: 'Женский',
    relationship_goal: 'communication',
    bio: 'Геймер и кофе',
    city: 'Казань',
    job: 'Разработчик',
    job_sphere: 'it',
    education_level: 'bachelor',
    education_details: '',
    photos: [MOCK_PHOTOS[2], MOCK_PHOTOS[0]],
    filter_option_ids: [],
    match_percentage: 85,
  },
  {
    user_id: 'ai-mock-4',
    username: 'sofia_ai',
    name: 'София',
    age: 27,
    gender: 'Женский',
    relationship_goal: 'relationship',
    bio: 'Спорт и ЗОЖ',
    city: 'Сочи',
    job: 'Тренер',
    job_sphere: 'sport',
    education_level: 'college',
    education_details: '',
    photos: [MOCK_PHOTOS[0]],
    filter_option_ids: [],
    match_percentage: 81,
  },
  {
    user_id: 'ai-mock-5',
    username: 'daria_ai',
    name: 'Дарья',
    age: 25,
    gender: 'Женский',
    relationship_goal: 'dating',
    bio: 'Книги и выставки',
    city: 'Москва',
    job: 'Редактор',
    job_sphere: 'media',
    education_level: 'bachelor',
    education_details: '',
    photos: [MOCK_PHOTOS[1]],
    filter_option_ids: [],
    match_percentage: 79,
  },
  {
    user_id: 'ai-mock-6',
    username: 'alina_ai',
    name: 'Алина',
    age: 22,
    gender: 'Женский',
    relationship_goal: 'relationship',
    bio: 'Собаки и активные выходные',
    city: 'Санкт-Петербург',
    job: 'Ветеринар',
    job_sphere: 'health',
    education_level: 'bachelor',
    education_details: '',
    photos: [MOCK_PHOTOS[2], MOCK_PHOTOS[1]],
    filter_option_ids: [],
    match_percentage: 76,
  },
  {
    user_id: 'ai-mock-7',
    username: 'vera_ai',
    name: 'Вера',
    age: 28,
    gender: 'Женский',
    relationship_goal: 'relationship',
    bio: 'Спокойные вечера и настолки',
    city: 'Новосибирск',
    job: 'Аналитик',
    job_sphere: 'it',
    education_level: 'master',
    education_details: '',
    photos: [MOCK_PHOTOS[0], MOCK_PHOTOS[2]],
    filter_option_ids: [],
    match_percentage: 74,
  },
  {
    user_id: 'ai-mock-8',
    username: 'polina_ai',
    name: 'Полина',
    age: 21,
    gender: 'Женский',
    relationship_goal: 'dating',
    bio: 'Танцы и путешествия',
    city: 'Москва',
    job: 'Студент',
    job_sphere: 'education',
    education_level: 'bachelor',
    education_details: '',
    photos: [MOCK_PHOTOS[1], MOCK_PHOTOS[0]],
    filter_option_ids: [],
    match_percentage: 71,
  },
]

const usersById = new Map(MOCK_AI_SEARCH_FEED_USERS.map((u) => [u.user_id, u]))

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function buildMockJobResults(jobId: string, resultCount: number | null): AiSearchJobResults {
  const pool = [...MOCK_AI_SEARCH_FEED_USERS]
  const count = Math.min(Math.max(resultCount ?? 8, 3), pool.length)
  const start = hashSeed(jobId) % pool.length
  const picked: UserSearchApiUser[] = []
  for (let i = 0; i < count; i++) {
    picked.push(pool[(start + i) % pool.length]!)
  }

  const userIds = picked.map((u) => u.user_id)
  const highlights: Record<string, string> = {}
  userIds.forEach((id, index) => {
    highlights[id] = HIGHLIGHT_SAMPLES[index % HIGHLIGHT_SAMPLES.length]!
  })

  return { userIds, highlights }
}

export function resolveMockAiSearchFeedUsers(userIds: string[]): UserSearchApiUser[] {
  return userIds
    .map((id) => usersById.get(id))
    .filter((u): u is UserSearchApiUser => u != null)
}
