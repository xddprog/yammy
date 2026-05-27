import type { AiSearchJob, AiSearchQuota, ParsedSearchPreview } from '../types'

import { buildMockJobResults } from './mockAiSearchFeedUsers'

const now = Date.now()
const h = (hours: number) => new Date(now - 1000 * 60 * 60 * hours).toISOString()

const PARSED_SPB: ParsedSearchPreview = {
  gender: 'female',
  ageMin: 22,
  ageMax: 28,
  city: 'Санкт-Петербург',
  relationshipGoal: 'relationship',
}

const PARSED_MOSCOW: ParsedSearchPreview = {
  gender: 'female',
  ageMin: 24,
  ageMax: 32,
  city: 'Москва',
  relationshipGoal: 'dating',
}

const PARSED_MALE: ParsedSearchPreview = {
  gender: 'male',
  ageMin: 25,
  ageMax: 35,
  city: 'Казань',
  relationshipGoal: 'communication',
}

export const MOCK_DEFAULT_QUOTA: AiSearchQuota = {
  remainingToday: 5,
  creditsBalance: 2,
  tier: 'free',
  dailyLimit: 0,
}

const MOCK_JOB_TEMPLATES: Array<{
  queryText: string
  status: AiSearchJob['status']
  hoursAgo: number
  parsed?: ParsedSearchPreview | null
  resultCount?: number | null
  errorMessage?: string
}> = [
  {
    queryText: 'девушка 22–28 из Питера, хочу серьёзные отношения',
    status: 'ready',
    hoursAgo: 2,
    parsed: PARSED_SPB,
    resultCount: 18,
  },
  {
    queryText: 'девушка которая любит йогу и кошек, Москва',
    status: 'searching',
    hoursAgo: 4,
    parsed: null,
    resultCount: null,
  },
  {
    queryText: 'парень 25–32, спорт, без курения, Сочи',
    status: 'ready',
    hoursAgo: 8,
    parsed: PARSED_MALE,
    resultCount: 11,
  },
  {
    queryText: 'asdf',
    status: 'failed',
    hoursAgo: 12,
    errorMessage: 'Не удалось разобрать запрос. Попробуйте описать подробнее.',
  },
  {
    queryText: 'общительная, любит путешествия и кино, 20–27 лет',
    status: 'ready',
    hoursAgo: 18,
    parsed: PARSED_MOSCOW,
    resultCount: 24,
  },
  {
    queryText: 'интеллигентный мужчина, высшее образование, для дружбы',
    status: 'ready',
    hoursAgo: 26,
    parsed: PARSED_MALE,
    resultCount: 9,
  },
  {
    queryText: 'блондинка, модельная внешность, 18–24',
    status: 'ready',
    hoursAgo: 30,
    parsed: PARSED_MOSCOW,
    resultCount: 31,
  },
  {
    queryText: 'хочу встретить кого-то для прогулок по центру',
    status: 'failed',
    hoursAgo: 36,
    errorMessage: 'Сервис временно недоступен. Попробуйте позже.',
  },
  {
    queryText: 'девушка с чувством юмора, не любит клубы',
    status: 'ready',
    hoursAgo: 42,
    parsed: PARSED_SPB,
    resultCount: 14,
  },
  {
    queryText: 'парень айтишник, геймер, Москва или область',
    status: 'ready',
    hoursAgo: 50,
    parsed: PARSED_MALE,
    resultCount: 7,
  },
  {
    queryText: 'спортивная, бег, ЗОЖ, 23–29',
    status: 'ready',
    hoursAgo: 58,
    parsed: PARSED_MOSCOW,
    resultCount: 16,
  },
  {
    queryText: 'креативная, дизайн, выставки, Питер',
    status: 'ready',
    hoursAgo: 66,
    parsed: PARSED_SPB,
    resultCount: 12,
  },
  {
    queryText: 'серьёзные отношения, готов к семье, 28–35',
    status: 'ready',
    hoursAgo: 72,
    parsed: PARSED_MOSCOW,
    resultCount: 20,
  },
  {
    queryText: 'лысый мужчина в костюме',
    status: 'parsing',
    hoursAgo: 1,
    parsed: null,
    resultCount: null,
  },
  {
    queryText: 'любит собак, большие, активные выходные',
    status: 'ready',
    hoursAgo: 80,
    parsed: PARSED_SPB,
    resultCount: 8,
  },
  {
    queryText: 'веган, экология, осознанность',
    status: 'ready',
    hoursAgo: 90,
    parsed: PARSED_MOSCOW,
    resultCount: 5,
  },
  {
    queryText: 'вечеринки, танцы, лёгкое общение',
    status: 'ready',
    hoursAgo: 100,
    parsed: PARSED_MOSCOW,
    resultCount: 22,
  },
  {
    queryText: 'инженер, спокойный, книги и настолки',
    status: 'ready',
    hoursAgo: 110,
    parsed: PARSED_MALE,
    resultCount: 6,
  },
  {
    queryText: 'медик, сменный график, понимающая',
    status: 'ready',
    hoursAgo: 120,
    parsed: PARSED_SPB,
    resultCount: 10,
  },
  {
    queryText: 'Поиск без пожеланий',
    status: 'ready',
    hoursAgo: 130,
    parsed: PARSED_MOSCOW,
    resultCount: 40,
  },
]

function truncateTitle(query: string, max = 40): string {
  const trimmed = query.trim()
  if (!trimmed) return 'Поиск без пожеланий'
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`
}

export const MOCK_INITIAL_JOBS: AiSearchJob[] = MOCK_JOB_TEMPLATES.map((t, index) => {
  const createdAt = h(t.hoursAgo)
  const completed =
    t.status === 'ready' || t.status === 'failed'
      ? new Date(new Date(createdAt).getTime() + 1000 * 60 * 3).toISOString()
      : null

  const id = `mock-job-seed-${index + 1}`
  const resultCount = t.resultCount ?? null

  return {
    id,
    title: truncateTitle(t.queryText),
    queryText: t.queryText,
    status: t.status,
    createdAt,
    completedAt: completed,
    parsed: t.parsed ?? null,
    resultCount,
    errorMessage: t.errorMessage,
    results:
      t.status === 'ready' && resultCount != null
        ? buildMockJobResults(id, resultCount)
        : null,
  }
})

export function buildMockParsedFromQuery(query: string): ParsedSearchPreview {
  const lower = query.toLowerCase()
  const parsed: ParsedSearchPreview = {
    gender: lower.includes('парн') || lower.includes('мужчин') ? 'male' : 'female',
    ageMin: 22,
    ageMax: 30,
    city: lower.includes('питер') || lower.includes('спб') ? 'Санкт-Петербург' : 'Москва',
    relationshipGoal: lower.includes('серьёз') || lower.includes('серьез')
      ? 'relationship'
      : 'dating',
  }
  return parsed
}
