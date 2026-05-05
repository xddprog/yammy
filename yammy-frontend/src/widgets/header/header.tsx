import { Heart, MessageSquare, SlidersHorizontal, User } from 'lucide-react'
import type { JSX } from 'react'
import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'

import { FiltersOverlayContentMemo } from '@/features/matches-filter'
import { Button, Image, cn, useOverlay } from '@/shared'

const HEADER_BUTTON_CLASS =
  'bg-secondary/35 hover:bg-secondary/55 active:scale-95 transition-all duration-200 focus-visible:ring-accent/60 text-foreground'
const FILTER_BUTTON_CLASS =
  'h-12 w-12 rounded-full bg-[#4a2a96]/55 text-white hover:bg-[#4a2a96]/65 active:scale-95 transition-all duration-200 focus-visible:ring-accent/60'
const ICON_SIZE = 20
const STROKE_WIDTH = 1.6

const Header = (): JSX.Element => {
  const { open } = useOverlay()
  const { pathname } = useLocation()

  const handleFiltersClick = useCallback(() => {
    open({
      panelClassName: 'relative w-full max-w-md flex items-end',
      content: (closeOverlay) => <FiltersOverlayContentMemo onClose={closeOverlay} />,
    })
  }, [open])

  const isLikesPage = pathname.includes('likes')
  const isChatsPage = pathname.includes('chats')
  const isProfilePage = pathname.includes('profile')
  const isDashboard = !isLikesPage && !isChatsPage && !isProfilePage

  return (
    <header
      className="mb-3 flex h-14 shrink-0 items-center justify-between gap-3 text-sm text-muted-foreground"
      role="banner"
    >
      {isDashboard ? (
        <>
          <div className="flex items-center gap-1.5">
            <Image src="/images/logo.png" alt="Yammy" className="h-8 w-8 object-contain" />
            <span
              className="text-[30px] font-medium leading-[0.95] text-white pt-0.5"
              style={{ fontFamily: "'Cabinet Grotesk', 'Bounded', system-ui, sans-serif" }}
            >
              Yammy
            </span>
          </div>

          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={FILTER_BUTTON_CLASS}
              aria-label="Фильтры"
              onClick={handleFiltersClick}
            >
              <SlidersHorizontal size={20} strokeWidth={STROKE_WIDTH} aria-hidden />
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
              className={cn(HEADER_BUTTON_CLASS, 'rounded-full gap-2 text-foreground')}
            >
              {isLikesPage && (
                <Heart
                  size={ICON_SIZE}
                  strokeWidth={STROKE_WIDTH}
                  className="text-primary"
                  aria-hidden
                />
              )}
              {isChatsPage && (
                <MessageSquare
                  size={ICON_SIZE}
                  strokeWidth={STROKE_WIDTH}
                  className="text-primary"
                  aria-hidden
                />
              )}
              {isProfilePage && (
                <User
                  size={ICON_SIZE}
                  strokeWidth={STROKE_WIDTH}
                  className="text-primary"
                  aria-hidden
                />
              )}
              {isLikesPage ? 'Лайки' : isChatsPage ? 'Метчи' : 'Профиль'}
            </Button>
          </div>
        </>
      )}
    </header>
  )
}

export default Header
