import ky from 'ky'

import { getAccessToken, getRefreshToken } from '@/entities'

const API_BASE_URL = 'http://localhost:8000/'

/** Таймаут запросов к API (мс). Бэкенд может отвечать долго. */
const REQUEST_TIMEOUT_MS = 60_000

export const publicApi = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  throwHttpErrors: false,
  parseJson: (text) => JSON.parse(text),
})

export const authApi = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  throwHttpErrors: false,
  hooks: {
    beforeRequest: [
      (request): void => {
        const token = getAccessToken() || '123'
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      //   async (request, options, response) => {
      async (_: Request, __: RequestInit, response: Response): Promise<Response> => {
        if (response.status === 401) {
          const refresh = getRefreshToken()
          if (!refresh) {
            console.warn('Refresh token missing, redirecting to login...')
            return response
          }

          //   const refreshResponse = await refreshToken({ refreshToken: refresh });

          //   if (refreshResponse?.accessToken) {
          //     setAccessToken(refreshResponse.accessToken);
          //     setRefreshToken(refreshResponse.refreshToken);

          //     return ky(request, {
          //       ...options,
          //       headers: {
          //         ...options.headers,
          //         Authorization: `Bearer ${refreshResponse.accessToken}`,
          //       },
          //     });
          //   }
        }

        return response
      },
    ],
  },
  parseJson: (text) => JSON.parse(text),
})
