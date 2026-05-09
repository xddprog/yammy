type Listener = (message: string) => void

let listener: Listener | null = null
const buffer: string[] = []

export const setErrorToastListener = (fn: Listener | null): void => {
  listener = fn
  if (fn != null && buffer.length > 0) {
    const last = buffer[buffer.length - 1]
    buffer.length = 0
    if (last != null) fn(last)
  }
}

export const showErrorToast = (message: string): void => {
  if (listener != null) {
    listener(message)
  } else {
    buffer.push(message)
  }
}
