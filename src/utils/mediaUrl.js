import { API_BASE_URL } from '../services/httpClient'

// Uploaded files come back as paths on the backend (/uploads/...): add the backend address for <img src> and <video src>.
// An address that is already complete (https, or blob:/data: for a file chosen in the page and not saved yet) stays as it is.
export function mediaUrl(path) {
  if (!path) return ''
  return /^(https?:\/\/|blob:|data:)/.test(path) ? path : `${API_BASE_URL}${path}`
}
