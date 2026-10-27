import i18n from '../i18n'
import { BACKEND_ERROR_CODES } from '../i18n/backendErrors'
import { formatCountdown, secondsLeft } from './retryAfter'

// The translation key of a backend error, or null when the message is not one of the backend's own (then the backend
// text is shown as it is). The backend answers with `message` (the English text of its MessageConstant) and a numeric
// `code` (the HTTP status); the string code of MessageConstant is not sent, so the English text is mapped to it.
function backendKey(error) {
  // the newer errors send their own string code (error.errorCode); the older ones are found by their English text
  if (error.errorCode && i18n.exists(`errors.backend.${error.errorCode}`)) {
    return `errors.backend.${error.errorCode}`
  }
  const code = BACKEND_ERROR_CODES[error.message]
  return code && i18n.exists(`errors.backend.${code}`) ? `errors.backend.${code}` : null
}

// Text to show the user for a failed service call (backend message plus field errors), in the selected language.
// Call it while rendering (ErrorAlert does), so the text follows a language change.
// `seconds` is the time to show in a "try again in {{time}}" message (default: what is left of the countdown).
export function errorMessage(error, seconds = secondsLeft(error)) {
  if (!error) {
    return i18n.t('errors.generic')
  }
  if (error.code === 0 && error.name === 'ApiError') {
    return i18n.t('errors.network')
  }
  const key = backendKey(error)
  const message = key ? i18n.t(key, { time: formatCountdown(seconds) }) : error.message
  // field errors (validation) come from the backend in English and stay as they are
  const fieldErrors = error.details ? Object.values(error.details) : []
  if (fieldErrors.length > 0) {
    return `${message}: ${fieldErrors.join('; ')}`
  }
  return message || i18n.t('errors.generic')
}

// The part of a failed call that belongs under a field: the backend's field errors (`details`, keyed by field name) for
// the `fields` of the form, and a business error whose English message is a key of `byMessage` (message -> field).
// Returns { field: text }; empty when nothing belongs to a field, then the page shows `errorMessage(error)` instead.
export function fieldErrors(error, fields, byMessage = {}) {
  const found = {}
  Object.entries(error?.details ?? {}).forEach(([field, text]) => {
    if (fields.includes(field)) found[field] = text
  })
  const target = byMessage[error?.message]
  if (target && !found[target]) found[target] = errorMessage(error)
  return found
}
