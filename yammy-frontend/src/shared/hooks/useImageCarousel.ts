import { useCallback, useState } from 'react'

export interface UseImageCarouselOptions {
  images: string[]
  initialIndex?: number
}

export interface UseImageCarouselResult {
  currentIndex: number
  currentImage: string
  canGoNext: boolean
  canGoPrevious: boolean
  goNext: () => void
  goPrevious: () => void
  goToIndex: (index: number) => void
  totalImages: number
}

export function useImageCarousel({
  images,
  initialIndex = 0,
}: UseImageCarouselOptions): UseImageCarouselResult {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const totalImages = images.length
  const currentImage = images[currentIndex] ?? images[0] ?? ''

  // Для бесконечной прокрутки всегда можно двигаться в любую сторону
  const canGoNext = totalImages > 1
  const canGoPrevious = totalImages > 1

  const goNext = useCallback(() => {
    if (totalImages === 0) return

    if (totalImages === 1) return

    // Бесконечная прокрутка: после последнего элемента переходим к первому
    setCurrentIndex((prev) => (prev + 1) % totalImages)
  }, [totalImages])

  const goPrevious = useCallback(() => {
    if (totalImages === 0) return

    if (totalImages === 1) return

    // Бесконечная прокрутка: перед первым элементом переходим к последнему
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages)
  }, [totalImages])

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalImages) {
        setCurrentIndex(index)
      }
    },
    [totalImages],
  )

  return {
    currentIndex,
    currentImage,
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
    goToIndex,
    totalImages,
  }
}
