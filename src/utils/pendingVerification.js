import { OTP_VALIDITY_SECONDS, PENDING_MAX_AGE_MINUTES, RESEND_COOLDOWN_SECONDS } from '../constants/otp'
import { maskEmail } from './text'

// The verification that is waiting for its code (register, staff login, reset password), kept in sessionStorage so a
// refresh stays on the code page. One key, one pending verification. It holds NO secret: never the password, never the
// code, never a token. Without the password and the code it can log nobody in by itself.
//   { purpose, email, maskedEmail, codeExpiresAt, resendAvailableAt, createdAt }   (times are ms timestamps)
const KEY = 'pendingVerification'
const MAX_AGE_MS = PENDING_MAX_AGE_MINUTES * 60 * 1000

const isTime = (value) => value === null || Number.isFinite(value)

function read() {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY))
    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

export function clearPending() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // storage blocked: nothing was kept
  }
}

// Saves a verification. `codeSent` false: no code was just sent (the user came from a "verify your email" link), so
// there is no expiry to count and the code can be sent again at once.
export function savePending({ purpose, email, codeSent = true }) {
  const now = Date.now()
  const pending = {
    purpose,
    email,
    maskedEmail: maskEmail(email),
    codeExpiresAt: codeSent ? now + OTP_VALIDITY_SECONDS * 1000 : null,
    resendAvailableAt: codeSent ? now + RESEND_COOLDOWN_SECONDS * 1000 : now,
    createdAt: now,
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(pending))
  } catch {
    // storage blocked: the page still works until it is refreshed
  }
  return pending
}

// Changes some fields of the stored verification (for example when the backend says when a resend is allowed).
export function updatePending(patch) {
  const value = read()
  if (!value) {
    return
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...value, ...patch }))
  } catch {
    // storage blocked
  }
}

// The stored verification of this purpose, or null. A missing, broken, too old or other-purpose entry is removed.
export function loadPending(purpose) {
  const value = read()
  if (!value) {
    return null
  }
  const valid =
    value.purpose === purpose &&
    typeof value.email === 'string' &&
    value.email !== '' &&
    typeof value.maskedEmail === 'string' &&
    isTime(value.codeExpiresAt) &&
    Number.isFinite(value.resendAvailableAt) &&
    Number.isFinite(value.createdAt) &&
    Date.now() - value.createdAt <= MAX_AGE_MS
  if (!valid) {
    clearPending()
    return null
  }
  return value
}
