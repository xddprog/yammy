import {
  Bell,
  GalleryHorizontalEnd,
  Heart,
  MessageSquare,
  SlidersHorizontal,
  Star,
} from 'lucide-react'
import type { JSX } from 'react'
import { useCallback } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'

import { FiltersOverlayContentMemo } from '@/features/matches-filter'
import { Button, cn, useOverlay } from '@/shared'

const HEADER_BUTTON_CLASS =
  'bg-muted hover:bg-muted/80 active:scale-95 transition-all duration-200 focus-visible:ring-[#FF6BA4]/50'
const ICON_SIZE = 20
const STROKE_WIDTH = 1.6

const Header = (): JSX.Element => {
  const { open } = useOverlay()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'swipe'

  const handleFiltersClick = useCallback(() => {
    open({
      panelClassName: 'relative w-full max-w-md flex items-end',
      content: (closeOverlay) => <FiltersOverlayContentMemo onClose={closeOverlay} />,
    })
  }, [open])

  const isLikesPage = pathname.includes('likes')
  const isChatsPage = pathname.includes('chats')

  return (
    <header
      className="mb-3 flex h-12 shrink-0 items-center justify-between gap-3 rounded-2xl text-sm text-muted-foreground"
      role="banner"
    >
      {isLikesPage || isChatsPage ? (
        <>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(HEADER_BUTTON_CLASS, 'rounded-full gap-2 text-foreground')}
            >
              {isLikesPage ? (
                <Heart
                  size={ICON_SIZE}
                  strokeWidth={STROKE_WIDTH}
                  className="text-[#FF6BA4]"
                  aria-hidden
                />
              ) : (
                <MessageSquare
                  size={ICON_SIZE}
                  strokeWidth={STROKE_WIDTH}
                  className="text-[#FF6BA4]"
                  aria-hidden
                />
              )}
              {isLikesPage ? 'Лайки' : 'Метчи'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(HEADER_BUTTON_CLASS, 'rounded-full')}
              aria-label="Уведомления"
            >
              <Bell
                size={ICON_SIZE}
                strokeWidth={STROKE_WIDTH}
                className="text-[#FF6BA4]"
                aria-hidden
              />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                HEADER_BUTTON_CLASS,
                'rounded-full gap-2 text-foreground',
                mode !== 'swipe' && 'bg-transparent text-muted-foreground',
              )}
              aria-label="Свайпы"
              onClick={() => setSearchParams({ mode: 'swipe' })}
            >
              <GalleryHorizontalEnd
                size={ICON_SIZE}
                strokeWidth={STROKE_WIDTH}
                className={cn(mode === 'swipe' && 'text-[#FF6BA4]')}
                aria-hidden
              />
              Свайпы
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                HEADER_BUTTON_CLASS,
                'rounded-full gap-2 text-foreground',
                mode !== 'rate' && 'bg-transparent text-muted-foreground',
              )}
              aria-label="Оценка"
              onClick={() => setSearchParams({ mode: 'rate' })}
            >
              <Star
                size={ICON_SIZE}
                strokeWidth={STROKE_WIDTH}
                className={cn(mode === 'rate' && 'text-[#FF6BA4]')}
                aria-hidden
              />
              Оценка
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(HEADER_BUTTON_CLASS, 'rounded-full')}
              aria-label="Уведомления"
            >
              <Bell
                size={ICON_SIZE}
                strokeWidth={STROKE_WIDTH}
                className="text-[#FF6BA4]"
                aria-hidden
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(HEADER_BUTTON_CLASS, 'rounded-full gap-2 text-foreground')}
              aria-label="Фильтры"
              onClick={handleFiltersClick}
            >
              <SlidersHorizontal size={ICON_SIZE} strokeWidth={STROKE_WIDTH} aria-hidden />
            </Button>
          </div>
        </>
      )}
    </header>
  )
}

export default Header
