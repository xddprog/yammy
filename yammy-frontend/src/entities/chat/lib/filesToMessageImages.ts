export type MessageImageUpload = {
  file: string
  content_type: string
}

export function filesToMessageImages(files: File[]): Promise<MessageImageUpload[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<MessageImageUpload>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () =>
            resolve({
              file: reader.result as string,
              content_type: file.type || 'image/jpeg',
            })
          reader.onerror = reject
          reader.readAsDataURL(file)
        }),
    ),
  )
}
