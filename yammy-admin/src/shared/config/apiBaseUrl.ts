export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const ADMIN_API_PREFIX = `${API_BASE_URL.replace(/\/$/, '')}/admin`
