const MESSAGE_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000

export function isMessageEditableByAge(createdAt: string): boolean {
  const createdTime = new Date(createdAt).getTime()
  if (!Number.isFinite(createdTime)) {
    return false
  }
  return Date.now() - createdTime <= MESSAGE_EDIT_WINDOW_MS
}
