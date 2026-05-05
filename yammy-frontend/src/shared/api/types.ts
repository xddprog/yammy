export interface ApiValidationErrorItem {
  loc: (string | number)[]
  msg: string
  type: string
  input?: unknown
  ctx?: Record<string, unknown>
}

export interface ApiErrorResponse {
  detail: ApiValidationErrorItem[] | string
}
