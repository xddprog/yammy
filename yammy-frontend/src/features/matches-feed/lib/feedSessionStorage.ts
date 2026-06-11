import type { FeedStackCardUser } from '@/entities/user/types/types'

const PREFIX = 'yammy_feed_session_v1:'

export interface FeedSessionState {
  currentIndex: number
  items: FeedStackCardUser[]
}

export function readFeedSession(key: string): FeedSessionState | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FeedSessionState
    if (!Array.isArray(parsed.items) || typeof parsed.currentIndex !== 'number') {
      return null
    }
    if (parsed.currentIndex < 0 || parsed.currentIndex > parsed.items.length) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeFeedSession(key: string, state: FeedSessionState): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(state))
  } catch {
    /* quota / private mode */
  }
}

export function clearFeedSession(key: string): void {
  sessionStorage.removeItem(PREFIX + key)
}
