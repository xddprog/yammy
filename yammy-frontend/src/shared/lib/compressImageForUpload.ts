const MAX_LONG_SIDE_PX = 1600
const JPEG_QUALITY = 0.85
/** Уже небольшие файлы не пережимаем — экономия CPU в TMA. */
const SKIP_COMPRESS_UNDER_BYTES = Math.floor(1.5 * 1024 * 1024)

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Не удалось сжать фото'))),
      'image/jpeg',
      quality,
    )
  })
}

/** Уменьшает фото перед upload: resize + JPEG. При ошибке возвращает исходный file. */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file
  }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
    const longSide = Math.max(bitmap.width, bitmap.height)
    if (longSide <= MAX_LONG_SIDE_PX && file.size <= SKIP_COMPRESS_UNDER_BYTES) {
      return file
    }

    const scale = MAX_LONG_SIDE_PX / longSide
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return file
    }

    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await canvasToJpegBlob(canvas, JPEG_QUALITY)
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return file
  } finally {
    bitmap?.close()
  }
}
