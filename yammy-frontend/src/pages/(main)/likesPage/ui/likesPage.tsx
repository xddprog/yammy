import type { JSX } from 'react'

import { LikesCard } from '@/features/likes-feed'
import { useMatchesOverlay } from '@/features/matches-feed/ui/matches-card/matchesOverlay'

import { stickyTopHeaderClassNames } from '@/widgets'

import { MOCK_LIKES } from '../lib/mockLikes'

const LikesPage = (): JSX.Element => {
  const { openProfileDetails } = useMatchesOverlay()

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden overflow-x-hidden bg-background px-4 text-foreground">
      <div className="min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-x-none no-scrollbar">
        <div className="flex flex-col gap-4 pb-4">
          <header
            className={stickyTopHeaderClassNames({ variant: 'background' })}
            aria-hidden
          />
          <div>
            <h1 className="mb-4 text-[22px] font-bold uppercase leading-none tracking-tight text-white">
              Лайки
            </h1>
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
        </div>
      </div>
    </div>
  )
}

export default LikesPage
