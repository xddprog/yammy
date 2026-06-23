import { compressImageForUpload } from '@/shared/lib/compressImageForUpload'

export type MessageImageUpload = {
  file: string
  content_type: string
}

function fileToDataUrl(file: File): Promise<MessageImageUpload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        file: reader.result as string,
        content_type: file.type || 'image/jpeg',
      })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function filesToMessageImages(files: File[]): Promise<MessageImageUpload[]> {
  const prepared = await Promise.all(files.map((file) => compressImageForUpload(file)))
  return Promise.all(prepared.map((file) => fileToDataUrl(file)))
}
