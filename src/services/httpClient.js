import axios from 'axios'
import ApiError from '../utils/ApiError'
import { clearToken, getToken } from '../utils/tokenStorage'

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

// Only a 401 on a request that carried a token means the session expired.
// A 401 from login (wrong password) must stay a normal error on the form.
function handleUnauthorized(config) {
  if (!config?.hadToken) {
    return
  }
  clearToken()
  unauthorizedHandler?.()
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
  (response) => {
    const body = response.data
    if (!isWrapper(body)) {
      return body
    }
    if (body.code >= 400) {
      if (body.code === 401) {
        handleUnauthorized(response.config)
      }
      throw ApiError.fromBody(body)
    }
    return unwrap(body)
  },
  (error) => {
    const { response } = error
    if (!response) {
      return Promise.reject(new ApiError('Cannot reach the server. Please try again.', { code: 0 }))
    }
    if (response.status === 401) {
      handleUnauthorized(response.config)
    }
    const body = response.data
    return Promise.reject(
      isWrapper(body)
        ? ApiError.fromBody(body)
        : new ApiError(response.statusText || 'Request failed', { code: response.status }),
    )
  },
)

export default httpClient
