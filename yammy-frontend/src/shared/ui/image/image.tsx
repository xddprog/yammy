import React, { CSSProperties, memo, useEffect, useState } from 'react'

import { useResolvedMediaSrc } from '@/shared/lib/media'

interface ImageProps {
  src: string
  alt: string
  className?: string
  styles?: CSSProperties
  width?: number | string
  height?: number | string
  aspectRatio?: number | string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none'
  loading?: 'eager' | 'lazy'
  decoding?: 'async' | 'auto' | 'sync'
  fetchPriority?: 'high' | 'low' | 'auto'
  fallbackSrc?: string
  onLoad?: () => void
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void
  onMouseDown?: (event: React.MouseEvent<HTMLImageElement, MouseEvent>) => void
  onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void
}

const ImageComponent = ({
  src,
  alt,
  className = '',
  styles,
  width,
  height,
  aspectRatio,
  objectFit,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'auto',
  fallbackSrc,
  onLoad,
  onError,
  onMouseDown,
  onClick,
}: ImageProps): React.JSX.Element => {
  const resolvedSrc = useResolvedMediaSrc(src)
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setCurrentSrc(resolvedSrc)
    setHasError(false)
  }, [resolvedSrc])

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && !hasError) {
      setCurrentSrc(fallbackSrc)
      setHasError(true)
    }
    onError?.(event)
  }

  const computedStyle: React.CSSProperties = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
    ...(aspectRatio && {
      aspectRatio: typeof aspectRatio === 'number' ? `${aspectRatio}` : aspectRatio,
    }),
    ...(objectFit && { objectFit }),
    ...styles,
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={computedStyle}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      draggable={false}
      onLoad={onLoad}
      onError={handleError}
      onMouseDown={onMouseDown}
      onClick={onClick}
    />
  )
}

export const Image = memo(ImageComponent)
