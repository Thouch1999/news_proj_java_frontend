import axios from 'axios'
import ApiError from '../utils/ApiError'
import { clearToken, getRefreshToken, getToken, setToken } from '../utils/tokenStorage'

// Rule: pages and hooks call service functions only (e.g. authService.logout), never axios directly.
// Every backend call lives in a file in this services folder and uses this client.
//
// Backend response wrapper (see the backend ApiResponseUtil / GlobalExceptionHandler):
//   success: { message, status, code, localDateTime, payload }
//   paged:   the same plus { page, size, totalElements, totalPages, first, last, empty, hasNext, hasPrevious }
//   error:   { code, status, error, message, details, localDateTime, path }
// Some errors (validation, bad JSON, JWT) come back with HTTP 200 and the real code only in the body,
// so a body `code` of 400 or more is treated as an error whatever the HTTP status is.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let unauthorizedHandler = null

// AuthProvider registers what to do when the session is no longer valid (clear state, go to login).
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

function isWrapper(body) {
  return body !== null && typeof body === 'object' && typeof body.code === 'number'
}

function unwrap(body) {
  if ('totalElements' in body) {
    return {
      items: body.payload ?? [],
      page: body.page,
      size: body.size,
      totalElements: body.totalElements,
      totalPages: body.totalPages,
      first: body.first,
      last: body.last,
      empty: body.empty,
      hasNext: body.hasNext,
      hasPrevious: body.hasPrevious,
    }
  }
  return body.payload ?? null
}

// Only a 401 on a request that carried a token means the access token expired.
// A 401 from login (wrong password) must stay a normal error on the form.
// The session lasts until logout: an expired access token is renewed with the refresh token, and the request is sent
// again. The user is sent to login only when the refresh token is missing or refused.
let refreshing = null

function renewAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) {
    return Promise.reject(new Error('no refresh token'))
  }
  // one renewal at a time: requests that fail together share it
  refreshing ??= axios
    .post(`${API_BASE_URL}/api/v1/auth/refresh`, { refresh })
    .then(({ data }) => {
      const access = data?.code < 400 ? data?.payload?.access : null
      if (!access) {
        throw new Error('refresh refused')
      }
      setToken(access)
      return access
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

// resolves with { value } (the result of the repeated request) when the renewal worked, otherwise ends the session and resolves null
async function handleUnauthorized(config) {
  if (!config?.hadToken) {
    return null
  }
  if (!config.retried) {
    try {
      await renewAccessToken()
      config.retried = true
      return { value: await httpClient.request(config) }
    } catch (error) {
      if (config.retried) {
        throw error // the repeated request failed for its own reason
      }
    }
  }
  clearToken()
  unauthorizedHandler?.()
  return null
}

httpClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    config.hadToken = true
  }
  return config
})

httpClient.interceptors.response.use(
  async (response) => {
    const body = response.data
    if (!isWrapper(body)) {
      return body
    }
    if (body.code >= 400) {
      if (body.code === 401) {
        const repeated = await handleUnauthorized(response.config)
        if (repeated !== null) {
          return repeated.value
        }
      }
      throw ApiError.fromBody(body)
    }
    return unwrap(body)
  },
  async (error) => {
    if (error instanceof ApiError) {
      throw error // from the repeated request, already converted
    }
    const { response } = error
    if (!response) {
      return Promise.reject(new ApiError('Cannot reach the server. Please try again.', { code: 0 }))
    }
    if (response.status === 401) {
      const repeated = await handleUnauthorized(response.config)
      if (repeated !== null) {
        return repeated.value
      }
    }
    const body = response.data
    return Promise.reject(
      isWrapper(body)
        ? ApiError.fromBody(body)
        : new ApiError(response.statusText || '', { code: response.status }),
    )
  },
)

export default httpClient
