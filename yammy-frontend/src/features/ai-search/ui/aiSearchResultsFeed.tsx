import type { JSX } from 'react'
import { memo, useCallback, useState } from 'react'

import { sendUserDislike, sendUserLike } from '@/entities/like/api/likeService'
import type { UserSearchApiUser } from '@/entities/user/types/types'
import { SwipeFeed } from '@/features/matches-feed/ui/swipe-feed/swipeFeed'
import { cn } from '@/shared'

import { AiSearchHighlightBlockMemo } from './aiSearchHighlightBlock'

export interface AiSearchResultsFeedProps {
  items: UserSearchApiUser[]
  highlights: Record<string, string>
  onEmpty?: () => void
  className?: string
}

const AiSearchResultsFeed = ({
  items,
  highlights,
  onEmpty,
  className,
}: AiSearchResultsFeedProps): JSX.Element => {
  const [topUserId, setTopUserId] = useState<string | null>(items[0]?.user_id ?? null)

  const highlightText = topUserId ? (highlights[topUserId] ?? null) : null

  const onLike = useCallback((item: UserSearchApiUser) => {
    void sendUserLike(item.user_id).catch(() => {
      /* throwApiError уже показал тост */
    })
  }, [])

  const onDislike = useCallback((item: UserSearchApiUser) => {
    void sendUserDislike(item.user_id).catch(() => {
      /* throwApiError уже показал тост */
    })
  }, [])

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-3', className)}>
      <div className="relative min-h-0 flex-1 overflow-x-hidden">
        <SwipeFeed
          items={items}
          fillHeight
          onSwipeLeft={onDislike}
          onSwipeRight={onLike}
          onSuperLike={onLike}
          onEmpty={onEmpty}
          onTopUserChange={setTopUserId}
        />
      </div>
      <AiSearchHighlightBlockMemo text={highlightText} />
    </div>
  )
}

export const AiSearchResultsFeedMemo = memo(AiSearchResultsFeed)
