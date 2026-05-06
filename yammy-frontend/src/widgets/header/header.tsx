import type { JSX } from 'react'
import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { FiltersOverlayContentMemo } from '@/features/matches-filter'
import { Button, cn, useOverlay } from '@/shared'

const Header = (): JSX.Element => {
  const { open } = useOverlay()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const handleFiltersClick = useCallback(() => {
    open({
      panelClassName: 'relative w-full max-w-md flex items-end',
      content: (closeOverlay) => <FiltersOverlayContentMemo onClose={closeOverlay} />,
    })
  }, [open])

  const handleLogoClick = useCallback(() => {
    const currentMode = searchParams.get('mode') === 'rate' ? 'rate' : 'swipe'
    const nextMode = currentMode === 'rate' ? 'swipe' : 'rate'
    navigate(`/dashboard?mode=${nextMode}`)
  }, [navigate, searchParams])

  return (
    <header className="mb-1.5 flex h-12 shrink-0 items-center justify-between" role="banner">
      <button
        type="button"
        className="flex items-center transition-transform duration-200 active:scale-95"
        aria-label="Главная"
        onClick={handleLogoClick}
      >
        <img src="/images/logo.svg" alt="Yammy" className="h-9 w-auto object-contain" />
      </button>

      <div className="flex items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            'rounded-full p-0 transition-transform duration-200 active:scale-95 hover:bg-transparent',
          )}
          aria-label="Фильтры"
          onClick={handleFiltersClick}
        >
          <img
            src="/images/filter.svg"
            alt="Фильтры"
            className="h-[24px] w-[24px] object-contain"
          />
        </Button>
      </div>
    </header>
  )
}

export default Header
