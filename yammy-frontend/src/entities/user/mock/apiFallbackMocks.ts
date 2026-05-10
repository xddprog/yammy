import type { FiltersMetadataResponse, UserSearchResult } from '../types/types'

/** Локальные ассеты из `public/images` — внешние URL в фолбэке часто не грузятся (сеть/CORS). */
const P1 = '/images/photo_2025-12-23_22-41-09.jpg'
const P2 = '/images/photo_2025-12-16_22-32-35.jpg'
const P3 = '/images/photo_2025-04-10_00-42-15.jpg'
const P4 = '/images/i.webp'

const RAW_USERS_SEARCH_FALLBACK: Array<Omit<UserSearchResult, 'username'>> = [
  {
    name: 'Ульяна',
    age: 26,
    gender: 'female',
    relationship_goal: 'relationship',
    bio: 'Обожаю готовить, смотреть сериалы и гулять с собакой. Ищу того, с кем будет комфортно.',
    city: 'Сочи',
    job: 'Реаниматолог',
    job_sphere: 'media',
    education_level: 'school',
    education_details: '',
    subscription_tier: 'vip',
    boost_expires_at: '2026-05-05T14:04:09.719113Z',
    last_seen: '2026-05-05T11:07:09.719110Z',
    is_banned: false,
    photos: [P1, P2, P3],
    user_id: '6b1a982e-b090-449f-811b-f6dd386cc239',
    filters: {
      appearance: {
        hair: ['bob', 'short'],
        style: ['classic', 'street'],
        body: ['average'],
      },
      interests: {
        sport: ['yoga', 'gym', 'swimming', 'running'],
      },
      lifestyle: {
        pets: ['dogs'],
      },
    },
    adequacy_score: 9.9,
    match_percentage: 56,
  },
  {
    name: 'Некрасова',
    age: 18,
    gender: 'female',
    relationship_goal: 'communication',
    bio: 'Активный образ жизни, бег по утрам, здоровое питание. Ищу партнера для совместных тренировок.',
    city: 'Казань',
    job: 'Маммолог',
    job_sphere: 'medicine',
    education_level: 'higher',
    education_details: 'МФТИ',
    subscription_tier: 'premium',
    boost_expires_at: '2026-05-05T14:04:09.760599Z',
    last_seen: '2026-05-05T10:26:09.760597Z',
    is_banned: false,
    photos: [P1, P1, P4],
    user_id: '69f480a0-e0a7-4729-b551-494487cec62b',
    filters: {
      interests: {
        hobby: ['cinema', 'photo'],
      },
      appearance: {
        hair: ['bob', 'bald'],
        style: ['sporty'],
      },
      lifestyle: {
        pets: ['cats', 'dogs', 'none'],
      },
    },
    adequacy_score: 9.6,
    match_percentage: 53,
  },
  {
    name: 'Прасковья',
    age: 29,
    gender: 'female',
    relationship_goal: 'party',
    bio: 'Танцы, искусство и хорошее вино - то, что люблю. Важна эмоциональная связь.',
    city: 'Санкт-Петербург',
    job: 'Техник',
    job_sphere: 'engineering',
    education_level: 'college',
    education_details: '',
    subscription_tier: 'free',
    boost_expires_at: '2026-05-05T14:04:09.753793Z',
    last_seen: '2026-05-05T10:30:09.753791Z',
    is_banned: false,
    photos: [P2],
    user_id: 'd1d56c41-52e9-4ba4-8f21-0cbcbcf10dc5',
    filters: {
      interests: {
        hobby: ['music', 'books'],
        sport: ['gym', 'yoga', 'swimming'],
      },
      lifestyle: {
        pets: ['cats'],
        routine: ['night'],
      },
      appearance: {
        style: ['sporty'],
        hair: ['long', 'bald'],
        body: ['slim', 'average'],
      },
    },
    adequacy_score: 9.1,
    match_percentage: 51,
  },
  {
    name: 'Прасковья',
    age: 18,
    gender: 'female',
    relationship_goal: 'relationship',
    bio: 'Интроверт, домосед, люблю тишину и уют. Ценю спокойствие и взаимопонимание.',
    city: 'Москва',
    job: 'Токарь-карусельщик',
    job_sphere: 'medicine',
    education_level: 'college',
    education_details: '',
    subscription_tier: 'premium',
    boost_expires_at: null,
    last_seen: '2026-05-02T17:03:09.728342Z',
    is_banned: false,
    photos: [P2, P2],
    user_id: '8700934c-c838-4163-ae5f-2df817db285d',
    filters: {
      lifestyle: {
        pets: ['cats', 'none'],
        routine: ['morning'],
      },
      interests: {
        sport: ['running'],
        hobby: ['photo', 'books', 'travel'],
      },
      appearance: {
        style: ['street'],
      },
    },
    adequacy_score: 8.3,
    match_percentage: 54,
  },
  {
    name: 'Иванна',
    age: 21,
    gender: 'female',
    relationship_goal: 'ons',
    bio: 'Обожаю спорт, книги и хорошую музыку. Ищу человека с похожими ценностями.',
    city: 'Сочи',
    job: 'Слесарь-механик',
    job_sphere: 'management',
    education_level: 'college',
    education_details: '',
    subscription_tier: 'vip',
    boost_expires_at: null,
    last_seen: '2026-04-30T19:16:09.746535Z',
    is_banned: false,
    photos: [P3],
    user_id: '419578a2-bddd-44a3-8a74-a879bd56ea47',
    filters: {
      appearance: {
        hair: ['long', 'bob', 'bald'],
        style: ['classic', 'street'],
        body: ['slim'],
      },
      interests: {
        hobby: ['cinema'],
        sport: ['gym'],
      },
    },
    adequacy_score: 8.9,
    match_percentage: 51,
  },
  {
    name: 'Анжела',
    age: 25,
    gender: 'female',
    relationship_goal: 'communication',
    bio: 'Нравится развиваться, пробовать новое и путешествовать. Важны уважение и честность.',
    city: 'Казань',
    job: 'Шорник',
    job_sphere: 'it',
    education_level: 'school',
    education_details: '',
    subscription_tier: 'premium',
    boost_expires_at: null,
    last_seen: '2026-04-30T13:08:09.729734Z',
    is_banned: false,
    photos: [P1, P4],
    user_id: '7d551821-b9e6-4716-8726-8c36ba6234e5',
    filters: {
      appearance: {
        hair: ['bald', 'long'],
      },
      interests: {
        sport: ['yoga', 'swimming', 'gym', 'running'],
        hobby: ['travel', 'cinema'],
      },
      lifestyle: {
        pets: ['dogs'],
      },
    },
    adequacy_score: 5.4,
    match_percentage: 56,
  },
]

export const USERS_SEARCH_FALLBACK_MOCK: UserSearchResult[] = RAW_USERS_SEARCH_FALLBACK.map(
  (user) => ({
    ...user,
    username: user.name,
  }),
)

export const FILTERS_METADATA_FALLBACK_MOCK: FiltersMetadataResponse = [
  {
    id: '1a0e26ff-3e9e-480a-b816-c3810488b979',
    slug: 'appearance',
    name: 'Внешность',
    subcategories: [
      {
        id: '64491d36-b1f3-4bab-9cf8-69e996bd8558',
        slug: 'hair',
        name: 'Волосы',
        options: [
          { id: '0332ae3e-173a-48b8-9bc7-dfb7e758cb05', slug: 'long', name: 'Длинные' },
          { id: 'a6a43a22-f8de-487d-83fe-d1637f61b5b8', slug: 'bob', name: 'Каре' },
          { id: 'fe3a3379-f31a-4027-a20e-8f296e9a801b', slug: 'short', name: 'Короткие' },
          { id: '0cdbe959-1255-44e3-b5b3-47310685f521', slug: 'bald', name: 'Лысый' },
        ],
      },
      {
        id: '303f6f68-84db-4dde-a94d-7a94173f31dc',
        slug: 'body',
        name: 'Телосложение',
        options: [
          { id: '71f1d680-b089-44f7-bf33-db8ef1c2e8a4', slug: 'athletic', name: 'Спортивное' },
          { id: '4c7f0aa1-5efe-48cf-9b01-ce08db5a0480', slug: 'slim', name: 'Худощавое' },
          { id: '4523ebef-8570-4b2c-bc71-96c4aa7dfebe', slug: 'muscular', name: 'Плотное' },
          { id: 'fc06bba0-cff6-4b6f-8a55-1995e8fe3ef2', slug: 'average', name: 'Среднее' },
        ],
      },
      {
        id: '1c97cc11-b31a-4b08-a2e2-81b44d2b6ffe',
        slug: 'style',
        name: 'Стиль',
        options: [
          { id: '03cdd5f6-62d4-49f6-8951-e4e30ef42972', slug: 'classic', name: 'Классика' },
          { id: '97a20d36-9376-4c85-b9ae-5c055a16f591', slug: 'sporty', name: 'Спортивный' },
          { id: '126746fa-40c5-4220-b9df-8cd58be338ff', slug: 'casual', name: 'Кэжуал' },
          { id: 'bd29488b-8c55-49c2-b87f-aa6d39463ca0', slug: 'street', name: 'Уличный' },
        ],
      },
    ],
  },
  {
    id: '15ba4b65-dbd4-4058-a0b6-7ec1d515897d',
    slug: 'interests',
    name: 'Интересы',
    subcategories: [
      {
        id: '44fc3fa5-ce5b-42c4-9d74-1e9cd3441409',
        slug: 'sport',
        name: 'Спорт',
        options: [
          { id: '16a6f826-11c0-4938-8958-530b08d33a66', slug: 'gym', name: 'Зал' },
          { id: '5c7b892d-0778-4cbe-9cab-a35655e8e0cf', slug: 'yoga', name: 'Йога' },
          { id: '8d9dc4f8-6595-4e79-b74e-7c4059d8c413', slug: 'running', name: 'Бег' },
          { id: '0d98e24c-7cc5-49aa-b024-3c670e108130', slug: 'swimming', name: 'Плавание' },
        ],
      },
      {
        id: 'cde6767a-be2c-4220-a00c-28544aa64fc8',
        slug: 'hobby',
        name: 'Хобби',
        options: [
          { id: 'f0ffe5f4-08d6-4f7c-876f-1257dc3aa934', slug: 'travel', name: 'Путешествия' },
          { id: '72a1b06e-98df-4f40-8430-7f88f8167999', slug: 'cinema', name: 'Кино' },
          { id: '0613d347-76a1-45cc-ac60-90b791d26607', slug: 'books', name: 'Книги' },
          { id: '3238e8a5-de74-444d-aec5-acb62cf78ab6', slug: 'music', name: 'Музыка' },
          { id: '52cace6d-b3b4-4411-8018-95098320280b', slug: 'photo', name: 'Фото' },
        ],
      },
    ],
  },
  {
    id: '92efd65a-183c-4b2c-bbfa-8e71b04f9fb3',
    slug: 'lifestyle',
    name: 'Лайфстайл',
    subcategories: [
      {
        id: '14a62453-b2bb-4c76-9949-c55236163630',
        slug: 'pets',
        name: 'Питомцы',
        options: [
          { id: '8bc03185-c00b-4b54-a066-9f65ab5356f4', slug: 'cats', name: 'Кошки' },
          { id: 'ecfc0ad3-7d34-40ae-858d-1535d7e975d3', slug: 'dogs', name: 'Собаки' },
          { id: '09d5aff3-eddc-47d9-b229-7a90997b16ba', slug: 'none', name: 'Нет' },
        ],
      },
      {
        id: '5cecf787-ae1a-4588-b0c0-3ea7c87b424c',
        slug: 'routine',
        name: 'Режим дня',
        options: [
          {
            id: '75fb4072-328d-40ec-9108-6d71b0bf9aa6',
            slug: 'morning',
            name: 'Жаворонок',
          },
          { id: 'e7ffc7c0-df7d-4828-8d93-5bc438befb35', slug: 'night', name: 'Сова' },
        ],
      },
    ],
  },
]
