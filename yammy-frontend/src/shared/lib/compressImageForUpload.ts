const MAX_LONG_SIDE_PX = 1600
const JPEG_QUALITY = 0.85
/** Уже небольшие файлы не пережимаем — экономия CPU в TMA. */
const SKIP_COMPRESS_UNDER_BYTES = Math.floor(1.5 * 1024 * 1024)

type DrawableSource = ImageBitmap | HTMLImageElement

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Не удалось сжать фото'))),
      'image/jpeg',
      quality,
    )
  })
}

function sourceWidth(source: DrawableSource): number {
  return source instanceof ImageBitmap ? source.width : source.naturalWidth
}

function sourceHeight(source: DrawableSource): number {
  return source instanceof ImageBitmap ? source.height : source.naturalHeight
}

function drawSource(ctx: CanvasRenderingContext2D, source: DrawableSource, width: number, height: number): void {
  if (source instanceof ImageBitmap) {
    ctx.drawImage(source, 0, 0, width, height)
    return
  }
  ctx.drawImage(source, 0, 0, width, height)
}

function releaseSource(source: DrawableSource | null): void {
  if (source instanceof ImageBitmap) {
    source.close()
  }
}

/** createImageBitmap падает на HEIC/пустом type в TMA — fallback через <img>. */
async function loadDrawableSource(file: File): Promise<DrawableSource> {
  try {
    return await createImageBitmap(file)
  } catch {
    const url = URL.createObjectURL(file)
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Не удалось прочитать фото'))
        img.src = url
      })
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

/** Уменьшает фото перед upload: resize + JPEG. GIF не трогаем. При ошибке — исходный file. */
export async function compressImageForUpload(file: File): Promise<File> {
  if (file.size === 0 || file.type === 'image/gif') {
    return file
  }

  let source: DrawableSource | null = null
  try {
    source = await loadDrawableSource(file)
    const width = sourceWidth(source)
    const height = sourceHeight(source)
    const longSide = Math.max(width, height)

    if (longSide <= MAX_LONG_SIDE_PX && file.size <= SKIP_COMPRESS_UNDER_BYTES) {
      return file
    }

    const scale = MAX_LONG_SIDE_PX / longSide
    const targetWidth = Math.max(1, Math.round(width * scale))
    const targetHeight = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return file
    }

    drawSource(ctx, source, targetWidth, targetHeight)
    const blob = await canvasToJpegBlob(canvas, JPEG_QUALITY)
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return file
  } finally {
    releaseSource(source)
  }
}
