import { AnimatePresence, motion } from 'framer-motion'
import type { JSX } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useUsersSearch } from '@/entities/user/hooks/useUsersSearch'
import { FeedLoading, RateFeed, SwipeFeed } from '@/features'
import { useFiltersSearchParams } from '@/features/matches-filter/model/useFiltersSearchParams'

const DashboardPage = (): JSX.Element => {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'swipe'

  const filterParams = useFiltersSearchParams()
  const { data: users = [], isLoading } = useUsersSearch(filterParams)

  if (isLoading) {
    return <FeedLoading />
  }

  return (
    <div className="h-full min-h-0">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          className="h-full min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {mode === 'rate' ? (
            <RateFeed
              items={users}
              fillHeight
              onSwipeLeft={(item) => console.log('Свайп влево (Скип)', item.user_id)}
              onSwipeRight={(item) => console.log('Свайп вправо', item.user_id)}
              onRate={(item, rating) => console.log('Оценка', item.user_id, rating)}
              onMessage={(item) => console.log('Сообщение', item.user_id)}
              onEmpty={() => console.log('Лента пуста')}
            />
          ) : (
            <SwipeFeed
              items={users}
              fillHeight
              onSwipeLeft={(item) => console.log('Дизлайк', item.user_id)}
              onSwipeRight={(item) => console.log('Лайк', item.user_id)}
              onSuperLike={(item) => console.log('Суперлайк', item.user_id)}
              onEmpty={() => console.log('Лента пуста')}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default DashboardPage
