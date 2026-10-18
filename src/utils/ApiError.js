// Error thrown by every service call. `message` is the backend message, `details` the field errors (if any).
export default class ApiError extends Error {
  constructor(message, { code = 0, details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }

  static fromBody(body) {
    return new ApiError(body.message || body.error || '', {
      code: body.code,
      details: body.details ?? null,
    })
  }
}
