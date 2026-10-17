import httpClient from './httpClient'

const AUTH = '/api/v1/auth'

// data: { username, fullName, email, password, confirm } (phone and address are optional)
export function register(data) {
  return httpClient.post(`${AUTH}/register`, data)
}

export function verifyEmail({ email, otp }) {
  return httpClient.post(`${AUTH}/verify-email`, { email, otp })
}

// purpose: REGISTER or RESET_PASSWORD
export function resendOtp({ email, purpose }) {
  return httpClient.post(`${AUTH}/resend-otp`, { email, purpose })
}

// returns { otpRequired } for staff, or { token: { access, refresh }, user, roles } for a reader
export function login({ email, password }) {
  return httpClient.post(`${AUTH}/login`, { email, password })
}

export function verifyLoginOtp({ email, otp }) {
  return httpClient.post(`${AUTH}/login/verify-otp`, { email, otp })
}

export function forgotPassword({ email }) {
  return httpClient.post(`${AUTH}/forgot-password`, { email })
}

export function resetPassword({ email, otp, password, confirm }) {
  return httpClient.post(`${AUTH}/reset-password`, { email, otp, password, confirm })
}

export function changePassword({ currentPassword, password, confirm }) {
  return httpClient.post(`${AUTH}/change-password`, { currentPassword, password, confirm })
}

export function logout() {
  return httpClient.post(`${AUTH}/logout`)
}
