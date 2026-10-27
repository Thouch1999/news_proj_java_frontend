// The "try again in ..." of the backend's protection errors (429 RATE_LIMITED, 429 ACCOUNT_TEMPORARILY_LOCKED, 403
// ACCOUNT_TOO_NEW). They carry `retryAfterSeconds`; ApiError turns it into `retryUntil` (a time), so every part of the
// page that shows the error counts down to the same moment.

// Does the error say when the user may try again?
export const hasRetry = (error) => Boolean(error?.retryUntil)

// Whole seconds left until the user may try again (0: now, or the error has no such time)
export function secondsLeft(error, now = Date.now()) {
  return error?.retryUntil ? Math.max(0, Math.ceil((error.retryUntil - now) / 1000)) : 0
}

// 750 -> '12:30', 59 -> '0:59', 3725 -> '1:02:05'
export function formatCountdown(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const pad = (number) => String(number).padStart(2, '0')
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`
}
