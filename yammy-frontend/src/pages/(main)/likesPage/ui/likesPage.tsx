import type { JSX } from 'react'

import { LikesCard } from '@/features/likes-feed'
import { useMatchesOverlay } from '@/features/matches-feed/ui/matches-card/matchesOverlay'

import { MOCK_LIKES } from '../lib/mockLikes'

const LikesPage = (): JSX.Element => {
  const { openProfileDetails } = useMatchesOverlay()

  return (
    <div className="h-full min-h-0 overflow-y-auto no-scrollbar pb-4 pt">
      <h1 className="mb-4 text-[28px] font-bold leading-none tracking-tight text-white">Ваши лайки</h1>
      <div className="grid grid-cols-2 gap-[15px]">
        {MOCK_LIKES.map((item) => (
          <LikesCard
            key={item.user_id}
            item={item}
            onClick={() =>
              openProfileDetails({
                item,
                onLike: () => console.log('Лайк', item.user_id),
                onDislike: () => console.log('Дизлайк', item.user_id),
              })
            }
          />
        ))}
      </div>
    </div>
  )
}

export default LikesPage
