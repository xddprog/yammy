export const ALLOWED_MESSAGE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
])

const ALLOWED_MESSAGE_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'])

export function isAllowedMessageImageFile(file: File): boolean {
  const contentType = file.type.split(';')[0].trim().toLowerCase()
  if (contentType && ALLOWED_MESSAGE_IMAGE_TYPES.has(contentType)) {
    return true
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension ? ALLOWED_MESSAGE_IMAGE_EXTENSIONS.has(extension) : false
}

export const MESSAGE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp'

export const MESSAGE_IMAGE_REJECT_HINT =
  'Неподдерживаемый формат изображения'
