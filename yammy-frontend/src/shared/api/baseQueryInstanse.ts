import ky, { type Options } from 'ky'

import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '@/entities'
import {
  API_BASE_URL,
  isNgrokApiBaseUrl,
  NGROK_SKIP_BROWSER_WARNING_HEADER,
} from '@/shared/config/apiBaseUrl'

/** Таймаут запросов к API (мс). Бэкенд может отвечать долго. */
const REQUEST_TIMEOUT_MS = 60_000

const REFRESH_SUBPATH = '/api/v1/auth/refresh'

type TokenPair = {
  access_token: string
  refresh_token: string
}

type KyRetryContext = Options & {
  context?: { authAccessRetry?: boolean }
}

function applyNgrokBypassHeader(headers: Headers): void {
  if (isNgrokApiBaseUrl()) {
    headers.set(NGROK_SKIP_BROWSER_WARNING_HEADER, '1')
  }
}

/** Опции повтора без prefixUrl/hooks инстанса authApi — иначе абсолютный request.url снова склеится с базой. */
function optionsForAbsoluteRetry(base: Options, headers: Headers): Options {
  applyNgrokBypassHeader(headers)
  const { hooks: _hooks, prefixUrl: _prefixUrl, ...rest } = base as Options & {
    hooks?: unknown
    prefixUrl?: unknown
  }
  return {
    ...rest,
    headers,
    timeout: REQUEST_TIMEOUT_MS,
    throwHttpErrors: false,
    parseJson: (text) => JSON.parse(text),
  }
}

export const publicApi = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  throwHttpErrors: false,
  hooks: {
    beforeRequest: [
      (request): void => {
        applyNgrokBypassHeader(request.headers)
      },
    ],
  },
  parseJson: (text) => JSON.parse(text),
})

async function refreshUserTokensOnce(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) {
    return false
  }

  const response = await publicApi.post('api/v1/auth/refresh', {
    json: { refresh_token: refresh },
  })

  if (!response.ok) {
    return false
  }

  const data = (await response.json()) as TokenPair
  if (!data.access_token || !data.refresh_token) {
    return false
  }

  setAccessToken(data.access_token)
  setRefreshToken(data.refresh_token)
  return true
}

/** Один общий refresh на параллельные 401, чтобы не дёргать /refresh десять раз подряд. */
let refreshInFlight: Promise<boolean> | null = null

function refreshUserTokensDeduped(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshUserTokensOnce().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

export const authApi = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  throwHttpErrors: false,
  hooks: {
    beforeRequest: [
      (request): void => {
        applyNgrokBypassHeader(request.headers)
        const token = getAccessToken()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (request, options, response): Promise<Response> => {
        if (response.status !== 401) {
          return response
        }

        if (request.url.includes(REFRESH_SUBPATH)) {
          return response
        }

        const opts = options as KyRetryContext
        if (opts.context?.authAccessRetry) {
          return response
        }

        const refreshed = await refreshUserTokensDeduped()
        if (!refreshed) {
          return response
        }

        const token = getAccessToken()
        if (!token) {
          return response
        }

        const headers = new Headers(request.headers)
        headers.set('Authorization', `Bearer ${token}`)

        return ky(request.url, {
          ...optionsForAbsoluteRetry(options, headers),
          context: {
            ...opts.context,
            authAccessRetry: true,
          },
        })
      },
    ],
  },
  parseJson: (text) => JSON.parse(text),
})
