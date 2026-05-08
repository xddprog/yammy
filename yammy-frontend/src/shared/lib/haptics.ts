type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'

interface TriggerHapticOptions {
  style?: HapticStyle
  vibrateMs?: number
}

export const triggerHaptic = ({
  style = 'light',
  vibrateMs = 18,
}: TriggerHapticOptions = {}): void => {
  const telegramWebApp = (
    globalThis as {
      Telegram?: {
        WebApp?: {
          HapticFeedback?: {
            impactOccurred?: (impactStyle: HapticStyle) => void
          }
        }
      }
    }
  ).Telegram?.WebApp

  if (telegramWebApp?.HapticFeedback?.impactOccurred) {
    telegramWebApp.HapticFeedback.impactOccurred(style)
    return
  }

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(vibrateMs)
  }
}
