// Error thrown by every service call. `message` is the backend message, `details` the field errors (if any).
// `errorCode` is the string code of the newer backend errors (RATE_LIMITED, ACCOUNT_TEMPORARILY_LOCKED, COMMENT_DUPLICATE ...),
// null for the older ones, which only have the message. `retryAfterSeconds` (and `retryUntil`, the same as a time in
// milliseconds) say when the user may try again.
export default class ApiError extends Error {
  constructor(message, { code = 0, details = null, errorCode = null, retryAfterSeconds = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
    this.errorCode = errorCode
    this.retryAfterSeconds = retryAfterSeconds
    this.retryUntil = retryAfterSeconds > 0 ? Date.now() + retryAfterSeconds * 1000 : null
  }

  static fromBody(body) {
    // `error` is a reason phrase ("Bad Request") for the older errors and an UPPER_SNAKE_CASE code for the newer ones
    const errorCode = /^[A-Z][A-Z0-9_]+$/.test(body.error ?? '') ? body.error : null
    return new ApiError(body.message || body.error || '', {
      code: body.code,
      details: body.details ?? null,
      errorCode,
      retryAfterSeconds: typeof body.retryAfterSeconds === 'number' ? body.retryAfterSeconds : null,
    })
  }
}
