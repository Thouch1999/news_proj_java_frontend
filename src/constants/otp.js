export const OTP_LENGTH = 6
export const RESEND_COOLDOWN_SECONDS = 60
// app.otp.ttl-seconds of the backend (the backend does not send the expiry time, so the page counts it)
export const OTP_VALIDITY_SECONDS = 180
// a pending verification kept in sessionStorage is dropped after this long
export const PENDING_MAX_AGE_MINUTES = 15

// Backend OtpPurpose values. REGISTER and RESET_PASSWORD are accepted by POST /api/v1/auth/resend-otp;
// LOGIN has no resend endpoint (a new login code is sent by calling the login again).
export const OTP_PURPOSE = {
  REGISTER: 'REGISTER',
  LOGIN: 'LOGIN',
  RESET_PASSWORD: 'RESET_PASSWORD',
}

// Backend message (MessageConstant.EMAIL_NOT_VERIFIED) returned with 403 when a staff account logs in unverified.
export const EMAIL_NOT_VERIFIED_MESSAGE = 'Email has not been verified by OTP'

// Translation key of the text shown after "forgot password" and on resend (same text whether or not the email has an account).
export const FORGOT_PASSWORD_NOTICE_KEY = 'auth.forgot.notice'
