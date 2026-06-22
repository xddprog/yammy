const STORAGE_KEY = 'yammy_app_guide_v1'

export function hasCompletedAppGuide(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markAppGuideCompleted(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* private mode / quota */
  }
}
