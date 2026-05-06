import { useId, useMemo } from 'react'
import { FEED_LOADING_PHRASES } from './feedLoadingPhrases'

const HEART_PATH =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 0.5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'

function getRandomPhrase(): [string, string] {
  const phrases = FEED_LOADING_PHRASES

  if (!phrases || phrases.length === 0) return ['', '']
  return phrases[Math.floor(Math.random() * phrases.length)] as [string, string]
}

export const FeedLoading = (): React.JSX.Element => {
  const [line1, line2] = useMemo(getRandomPhrase, [])
  const gradientId = useId().replace(/:/g, '-')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[48px] bg-background text-[#FF6BA4]/80">
      <svg
        className="size-10 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6BA4" />
            <stop offset="50%" stopColor="#FFD1E3" />
            <stop offset="100%" stopColor="#FF6BA4" />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="-1 0"
              to="1 0"
              dur="2s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>

        <path d={HEART_PATH} stroke={`url(#${gradientId})`} strokeWidth="2" />
      </svg>

      <p className="text-center text-xs font-light leading-relaxed">
        {line1}
        <br />
        {line2}
      </p>
    </div>
  )
}
