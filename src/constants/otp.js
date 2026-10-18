export const OTP_LENGTH = 6
export const RESEND_COOLDOWN_SECONDS = 60

// Backend OtpPurpose values accepted by POST /api/v1/auth/resend-otp
export const OTP_PURPOSE = {
  REGISTER: 'REGISTER',
  RESET_PASSWORD: 'RESET_PASSWORD',
}

// Backend message (MessageConstant.EMAIL_NOT_VERIFIED) returned with 403 when a staff account logs in unverified.
export const EMAIL_NOT_VERIFIED_MESSAGE = 'Email has not been verified by OTP'

// Translation key of the text shown after "forgot password" and on resend (same text whether or not the email has an account).
export const FORGOT_PASSWORD_NOTICE_KEY = 'auth.forgot.notice'
