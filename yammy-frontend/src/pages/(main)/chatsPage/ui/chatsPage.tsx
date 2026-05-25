import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import type { JSX } from 'react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppLogoLoader } from '@/app/ui/AppLogoLoader'
import { flattenChatsPages, useChatsList } from '@/entities/chat'
import { ChatItem, ChatsSearchField, ChatsStoriesRow } from '@/features/chats'
import { FeedLoading } from '@/features/matches-feed/ui/feed-loading'
import { cn } from '@/shared'
import { useInfiniteScrollLoadMore } from '@/shared/hooks/useInfiniteScrollLoadMore'
import { formatUserErrorMessage } from '@/shared/lib/formatUserErrorMessage'
import { ERouteNames } from '@/shared/lib/routeVariables'
import { stickyTopHeaderClassNames } from '@/widgets'

const headerEase = [0.22, 0.61, 0.36, 1] as const

const ChatsPage = (): JSX.Element => {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const chatsQuery = useChatsList()

  const chats = useMemo(() => flattenChatsPages(chatsQuery.data), [chatsQuery.data])

  useInfiniteScrollLoadMore({
    scrollRootRef: scrollRef,
    sentinelRef: loadMoreRef,
    hasNextPage: chatsQuery.hasNextPage,
    isFetchingNextPage: chatsQuery.isFetchingNextPage,
    fetchNextPage: () => void chatsQuery.fetchNextPage(),
  })

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      return chats
    }
    return chats.filter((chat) => chat.name.toLowerCase().includes(q))
  }, [chats, searchQuery])

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  const toggleSearch = () => {
    if (searchOpen) closeSearch()
    else setSearchOpen(true)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden overflow-x-hidden bg-background px-4 text-foreground">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-x-none no-scrollbar scroll-pb-[calc(5.25rem+2.25rem+3.5rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="flex flex-col gap-4 pb-[calc(5.25rem+2.25rem+3.5rem+env(safe-area-inset-bottom,0px))]">
          <header
            className={cn(
              stickyTopHeaderClassNames({ variant: 'background' }),
              'flex min-h-11 shrink-0 items-center gap-2',
            )}
          >
            <div className="relative flex h-11 min-w-0 flex-1 items-center">
              <AnimatePresence initial={false} mode="popLayout">
                {!searchOpen ? (
                  <motion.h1
                    key="chats-title"
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22, ease: headerEase }}
                    className="text-[22px] font-bold uppercase leading-none tracking-tight text-foreground"
                  >
                    Чаты
                  </motion.h1>
                ) : (
                  <motion.div
                    key="chats-search"
                    layout
                    initial={{ opacity: 0, x: 20, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: headerEase }}
                    className="w-full min-w-0"
                  >
                    <ChatsSearchField
                      value={searchQuery}
                      onChange={setSearchQuery}
                      inline
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              layout
              type="button"
              onClick={toggleSearch}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              whileTap={{ scale: 0.92 }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground"
              aria-label={searchOpen ? 'Закрыть поиск' : 'Поиск'}
              aria-expanded={searchOpen}
            >
              <AnimatePresence initial={false} mode="popLayout">
                {searchOpen ? (
                  <motion.span
                    key="close"
                    initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                    transition={{ duration: 0.18, ease: headerEase }}
                    className="flex items-center justify-center"
                  >
                    <X className="size-[22px]" strokeWidth={2} aria-hidden />
                  </motion.span>
                ) : (
                  <motion.span
                    key="search"
                    initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
                    transition={{ duration: 0.18, ease: headerEase }}
                    className="flex items-center justify-center"
                  >
                    <Search className="size-[22px]" strokeWidth={2} aria-hidden />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </header>

          {chatsQuery.isPending ? (
            <div className="flex min-h-[min(420px,70vh)] items-center justify-center">
              <FeedLoading />
            </div>
          ) : chatsQuery.isError ? (
            <div className="flex min-h-[min(420px,70vh)] flex-col items-center justify-center gap-3 text-center">
              <p className="text-[15px] font-medium text-muted-foreground">
                {formatUserErrorMessage(chatsQuery.error)}
              </p>
              <button
                type="button"
                onClick={() => void chatsQuery.refetch()}
                className="rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground"
              >
                Повторить
              </button>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex min-h-[min(420px,70vh)] flex-col items-center justify-center text-center">
              <p className="text-[15px] font-medium text-muted-foreground">Пока нет чатов</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Метч появится после взаимного лайка</p>
            </div>
          ) : (
            <>
              <ChatsStoriesRow
                chats={chats}
                onStoryClick={(id) => navigate(`/${ERouteNames.CHATS_ROUTE}/${id}`)}
              />
              <div className="flex flex-col gap-1.5">
                {filteredChats.length > 0 ? (
                  filteredChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      onClick={() => navigate(`/${ERouteNames.CHATS_ROUTE}/${chat.id}`)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center pt-8 text-center">
                    <p className="text-[15px] font-medium text-muted-foreground">Ничего не найдено</p>
                  </div>
                )}
                {(chatsQuery.hasNextPage || chatsQuery.isFetchingNextPage) && (
                  <div
                    ref={loadMoreRef}
                    className={cn(
                      'flex shrink-0 items-center justify-center',
                      chatsQuery.isFetchingNextPage ? 'py-1.5' : 'h-px',
                    )}
                    aria-busy={chatsQuery.isFetchingNextPage}
                    aria-label={chatsQuery.isFetchingNextPage ? 'Подгрузка чатов' : undefined}
                  >
                    {chatsQuery.isFetchingNextPage && <AppLogoLoader size="small" />}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatsPage
