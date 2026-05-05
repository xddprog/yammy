const AUTH_ROOT = ['auth'] as const

export const authQueryKeys = {
  all: AUTH_ROOT,
  currentUser: () => [...AUTH_ROOT, 'currentUser'] as const,
} as const
