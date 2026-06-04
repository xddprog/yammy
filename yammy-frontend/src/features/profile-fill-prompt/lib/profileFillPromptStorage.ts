const STORAGE_KEY = 'yammy_profile_fill_prompt_day'

function localDayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function wasProfileFillPromptHandledToday(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === localDayKey()
  } catch {
    return false
  }
}

export function markProfileFillPromptHandledToday(): void {
  try {
    localStorage.setItem(STORAGE_KEY, localDayKey())
  } catch {
    /* private mode / quota */
  }
}
