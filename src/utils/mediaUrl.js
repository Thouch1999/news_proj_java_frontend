import { API_BASE_URL } from '../services/httpClient'

// Uploaded files come back as paths on the backend (/uploads/...): add the backend address for <img src>.
export function mediaUrl(path) {
  if (!path) return ''
  return /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`
}
