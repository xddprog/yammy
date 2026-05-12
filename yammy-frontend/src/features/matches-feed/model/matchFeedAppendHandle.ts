import type { FeedStackCardUser } from '@/entities/user/types/types'

/** Императивная подгрузка карточек после refetch поиска (см. `SwipeFeed` / `RateFeed`). */
export type MatchFeedAppendHandle = {
  /** Возвращает число реально добавленных карточек (0, если все уже были в ленте). */
  appendItems: (items: FeedStackCardUser[]) => number
}
