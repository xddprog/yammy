const TAROT_COMPATIBILITY_ROOT = ['tarot-compatibility'] as const

export const tarotCompatibilityQueryKeys = {
  all: TAROT_COMPATIBILITY_ROOT,
  withPartner: (partnerUserId: string) =>
    [...TAROT_COMPATIBILITY_ROOT, 'with', partnerUserId] as const,
  job: (id: string) => [...TAROT_COMPATIBILITY_ROOT, 'job', id] as const,
}
