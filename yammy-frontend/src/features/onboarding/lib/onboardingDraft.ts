export type OnboardingStep = 1 | 2 | 3 | 4

export type OnboardingDraft = {
  name: string
  age: number | null
  gender: 'Мужской' | 'Женский' | null
  city: string
  educationLevel: 'school' | 'college' | 'higher' | null
  educationLabel: string
  educationInstitution: string
  relationshipGoal: string | null
  relationshipGoalLabel: string
  bio: string
  filterOptionIds: string[]
}

const STEP_KEY = 'yammy_onboarding_step'
const DRAFT_KEY = 'yammy_onboarding_draft'

export const emptyOnboardingDraft = (): OnboardingDraft => ({
  name: '',
  age: null,
  gender: null,
  city: '',
  educationLevel: null,
  educationLabel: '',
  educationInstitution: '',
  relationshipGoal: null,
  relationshipGoalLabel: '',
  bio: '',
  filterOptionIds: [],
})

export function loadOnboardingStep(): OnboardingStep {
  const raw = sessionStorage.getItem(STEP_KEY)
  const n = Number(raw)
  if (n >= 1 && n <= 4) return n as OnboardingStep
  return 1
}

export function saveOnboardingStep(step: OnboardingStep): void {
  sessionStorage.setItem(STEP_KEY, String(step))
}

export function loadOnboardingDraft(): OnboardingDraft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return emptyOnboardingDraft()
    return { ...emptyOnboardingDraft(), ...JSON.parse(raw) } as OnboardingDraft
  } catch {
    return emptyOnboardingDraft()
  }
}

export function saveOnboardingDraft(draft: OnboardingDraft): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function clearOnboardingSession(): void {
  sessionStorage.removeItem(STEP_KEY)
  sessionStorage.removeItem(DRAFT_KEY)
}
