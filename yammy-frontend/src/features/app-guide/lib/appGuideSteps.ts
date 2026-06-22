export type AppGuideStepId =
  | 'feed-card'
  | 'match-score'
  | 'profile-details'
  | 'ai-search'
  | 'filters'
  | 'mode-toggle'
  | 'finish'

export type AppGuidePlacement = 'top' | 'bottom' | 'center'

export type AppGuideStep = {
  id: AppGuideStepId
  title?: string
  body: string
  placement: AppGuidePlacement
  /** Показывать только если в ленте есть карточки. */
  requiresFeed?: boolean
  borderRadius?: number
  padding?: number
}

export const APP_GUIDE_STEPS: AppGuideStep[] = [
  {
    id: 'feed-card',
    title: 'Лента знакомств',
    body: 'Свайпай влево — пропуск, вправо — лайк. Или пользуйся кнопками внизу.',
    placement: 'top',
    requiresFeed: true,
    borderRadius: 48,
    padding: 4,
  },
  {
    id: 'match-score',
    title: 'Совместимость',
    body: 'Процент совместимости, рассчитанный на основе вашей анкеты и анкеты человека!',
    placement: 'top',
    requiresFeed: true,
    borderRadius: 9999,
    padding: 6,
  },
  {
    id: 'profile-details',
    title: 'Полная анкета',
    body: 'Нажми на круг с процентом — откроется анкета целиком: фото, описание и интересы.',
    placement: 'top',
    requiresFeed: true,
    borderRadius: 9999,
    padding: 6,
  },
  {
    id: 'ai-search',
    title: 'AI-поиск',
    body: 'Опиши текстом, кого ищешь — мы подберём подходящих людей с помощью ИИ.',
    placement: 'bottom',
    borderRadius: 9999,
    padding: 6,
  },
  {
    id: 'filters',
    title: 'Фильтры',
    body: 'Настрой пол, возраст, город, интересы и приоритеты — лента покажет только подходящих.',
    placement: 'bottom',
    borderRadius: 9999,
    padding: 6,
  },
  {
    id: 'mode-toggle',
    title: 'Режим оценки',
    body: 'Нажми на лого — переключишь режим оценки внешности.',
    placement: 'bottom',
    borderRadius: 12,
    padding: 6,
  },
  {
    id: 'finish',
    title: 'Готово!',
    body: 'Удачи в знакомствах.',
    placement: 'center',
  },
]

export function resolveAppGuideSteps(hasCards: boolean): AppGuideStep[] {
  return APP_GUIDE_STEPS.filter((step) => !step.requiresFeed || hasCards)
}
