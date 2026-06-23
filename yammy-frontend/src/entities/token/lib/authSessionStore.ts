type AuthSessionListener = () => void

const listeners = new Set<AuthSessionListener>()

export function subscribeAuthSession(listener: AuthSessionListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyAuthSessionChanged(): void {
  for (const listener of listeners) {
    listener()
  }
}
