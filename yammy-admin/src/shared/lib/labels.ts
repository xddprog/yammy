const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  support: 'Поддержка',
}

const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  reviewed: 'Рассмотрена',
  dismissed: 'Отклонена',
}

const REPORT_REASON_LABELS: Record<string, string> = {
  spam: 'Спам',
  inappropriate_content: 'Неприемлемый контент',
  harassment: 'Домогательства',
  fake_profile: 'Фейковый профиль',
  other: 'Другое',
}

const SUBSCRIPTION_TIER_LABELS: Record<string, string> = {
  free: 'Бесплатная',
  vip: 'VIP',
  premium: 'Premium',
}

export function labelRole(role: string): string {
  return ROLE_LABELS[role] ?? role
}

export function labelReportStatus(status: string): string {
  return REPORT_STATUS_LABELS[status] ?? status
}

export function labelReportReason(reason: string): string {
  return REPORT_REASON_LABELS[reason] ?? reason
}

export function labelSubscriptionTier(tier: string): string {
  return SUBSCRIPTION_TIER_LABELS[tier] ?? tier
}

export const t = {
  loading: 'Загрузка…',
  loadingDashboard: 'Загрузка дашборда…',
  back: '← Назад',
  logout: 'Выйти',
  appTitle: 'Yammy — Админка',

  loginTitle: 'Вход в админку',
  username: 'Логин',
  password: 'Пароль',
  signIn: 'Войти',
  invalidCredentials: 'Неверный логин или пароль',

  filters: 'Фильтры',
  filtersCatalog: 'Каталог фильтров',
  filterCategory: 'Категория',
  filterSubcategory: 'Подкатегория',
  filterOption: 'Опция',
  filterSlug: 'Slug (латиница)',
  filterName: 'Название',
  addFilterCategory: 'Добавить категорию',
  addFilterSubcategory: 'Добавить подкатегорию',
  addFilterOption: 'Добавить опцию',
  deleteFilter: 'Удалить',
  deleteFilterConfirm:
    'Удалить? У пользователей с этим фильтром связь будет снята в БД и Elasticsearch сразу.',
  filterDeleteDone: 'Удалено. Пользователей затронуто:',
  filterReindexed: 'переиндексировано в ES:',
  save: 'Сохранить',
  saving: 'Сохранение…',
  errorGeneric: 'Ошибка',

  dashboard: 'Дашборд',
  users: 'Пользователи',
  profiles: 'Профили',
  reports: 'Жалобы',

  period1d: '1 день',
  period7d: '7 дней',
  period30d: '30 дней',
  period90d: '90 дней',
  periodCustom: 'Свой период',
  periodPreset: 'Быстрый период',
  periodDaysSuffix: 'дн.',
  dateFrom: 'С',
  dateTo: 'По',
  statsRangeHint: 'Период статистики',
  refreshStats: 'Обновить',
  refreshingStats: 'Обновление…',
  statsNotRealtimeHint: 'Статистика не в реальном времени — нажмите «Обновить» после действий в приложении',
  invalidDateRange: 'Укажите корректный диапазон дат',

  statTotalUsers: 'Пользователей',
  statNewUsers: 'Новых',
  statDau: 'DAU',
  statDauHint: 'Daily Active Users — заходили за последние 24 часа',
  statWau: 'WAU',
  statWauHint: 'Weekly Active Users — заходили за последние 7 дней',
  statMau: 'MAU',
  statMauHint: 'Monthly Active Users — заходили за последние 30 дней',
  statMatches: 'Мэтчей',
  statMessages: 'Сообщений',
  statReports: 'Жалоб',
  statPendingModeration: 'На модерации',

  chartRegistrations: 'Регистрации',
  chartEngagement: 'Активность (сообщения)',
  chartTooltipRegistrations: 'Регистраций',
  chartTooltipMessages: 'Сообщений',
  blockSubscriptions: 'Подписки',
  tierFree: 'Бесплатные',
  tierVip: 'VIP',
  tierPremium: 'Premium',
  paidSumPeriod: 'Оплачено за период',
  revenuePeriod: 'Доход за период',
  revenueTotal: 'Доход всего',
  paymentsCountPeriod: 'Оплат за период',
  chartRevenue: 'Доход по дням',
  revenueHint: 'Сумма успешных транзакций (payments, status=paid)',

  userSearchFilters: 'Фильтры поиска',
  searchResults: 'Найдено',
  filterCity: 'Город',
  filterAnyGender: 'Любой пол',
  genderMale: 'Мужской',
  genderFemale: 'Женский',
  filterAgeMin: 'Возраст от',
  filterAgeMax: 'Возраст до',
  filterAnyGoal: 'Любая цель',
  goalDating: 'Свидания',
  goalFriendship: 'Дружба',
  goalCommunication: 'Общение',
  goalRelationship: 'Отношения',
  goalFwb: 'FWB',
  goalOns: 'ONS',
  goalParty: 'Тусовки',
  filterAnyJobSphere: 'Любая сфера работы',
  jobDesign: 'Дизайн',
  jobFinance: 'Финансы',
  jobMedicine: 'Медицина',
  jobEducation: 'Образование',
  jobOther: 'Другое',
  filterAnyEducation: 'Любое образование',
  educationSchool: 'Школа',
  educationCollege: 'Колледж',
  educationHigher: 'Высшее',
  filterEducationDetails: 'Учебное заведение',
  filterAnySubscription: 'Любая подписка',
  filterAnyBanStatus: 'Любой статус блокировки',
  filterNotBanned: 'Не заблокированы',
  filterBannedOnly: 'Только заблокированные',
  filterAnyModeration: 'Любая модерация',
  filterModerationApproved: 'Одобрены',
  filterModerationPending: 'На модерации',
  profileCharacteristics: 'Характеристики профиля',
  chartTooltipRevenue: 'Доход',
  blockAiSearch: 'AI-поиск',
  aiSearching: 'В поиске',
  aiReady: 'Готово',
  aiFailed: 'Ошибки',
  blockSafety: 'Безопасность',
  bannedUsers: 'Заблокировано',

  profileModeration: 'Модерация профилей',
  queueEmpty: 'Очередь пуста',
  pending: 'Ожидает',
  approve: 'Одобрить',
  reject: 'Отклонить',

  reportedUsers: 'Жалобы на пользователей',
  searchByName: 'Поиск по имени',
  noReportedUsers: 'Нет пользователей с жалобами',
  pendingReports: 'в ожидании',
  totalReports: 'всего',
  banUser: 'Заблокировать',
  resolveAllPending: 'Закрыть все ожидающие',

  searchUsersPlaceholder: 'Имя, Telegram ID или UUID',
  banned: 'Заблокирован',
  moderationPending: 'На модерации',
  moderationRejected: 'Отклонён',

  reportsList: 'Жалобы',
  noReports: 'Жалоб нет',
  reportFrom: 'От:',
  viewChat: 'Переписка',
  hideChat: 'Скрыть переписку',
  loadingChat: 'Загрузка переписки…',
  noChatBetweenUsers: 'Чата между этими пользователями нет (нет матча)',
  reportedUser: 'Обвиняемый',
  messageEdited: 'изменено',
  markReviewed: 'Рассмотрена',
  dismiss: 'Отклонить',

  actions: 'Действия',
  unban: 'Разблокировать',
  ban: 'Заблокировать',
  subscription: 'Подписка',
  saveSubscription: 'Сохранить подписку',
  balances: 'Балансы',
  superlikes: 'Суперлайки',
  boosts: 'Бусты',
  saveBalances: 'Сохранить балансы',
  rejectModeration: 'Снять одобрение',
  approveModeration: 'Одобрить профиль',

  statLikesIn: 'Входящие лайки',
  statLikesOut: 'Исходящие лайки',
  statMatchesShort: 'Матчи',
  statViews: 'Просмотры',
  statReportsShort: 'Жалобы',
  statMessagesShort: 'Сообщения',
  statAiJobs: 'AI-запросы',
  statTier: 'Подписка',
} as const
