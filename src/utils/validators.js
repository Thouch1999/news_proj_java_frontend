// Client-side rules that mirror the backend request validation (Jakarta annotations).
// Each rule returns an error text (in the selected language, translated when the rule runs), or '' when the value is valid.
import i18n from '../i18n'
import { OTP_LENGTH } from '../constants/otp'
import { IMAGE_TYPES, UPLOAD_MAX_BYTES } from '../constants/upload'

const EMAIL = /^[^\s@]+@[^\s@]+$/
const USERNAME = /^[a-zA-Z\s]+$/
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const PHONE = /^0[1-9][0-9]{7,8}$/
const OTP = new RegExp(`^\\d{${OTP_LENGTH}}$`)

const t = (key, options) => i18n.t(key, options)

export const rules = {
  email(value) {
    if (!value.trim()) return t('auth.validation.emailBlank')
    return EMAIL.test(value.trim()) ? '' : t('auth.validation.emailInvalid')
  },
  username(value) {
    if (!value.trim()) return t('auth.validation.usernameBlank')
    return USERNAME.test(value) ? '' : t('auth.validation.usernameInvalid')
  },
  fullName(value) {
    return value.length > 255 ? t('auth.validation.fullNameMax', { max: 255 }) : ''
  },
  password(value) {
    if (!value) return t('auth.validation.passwordBlank')
    return value.length >= 8 ? '' : t('auth.validation.passwordMin', { min: 8 })
  },
  confirm(password, value) {
    if (!value) return t('auth.validation.confirmBlank')
    return password === value ? '' : t('auth.validation.confirmMismatch')
  },
  required(label) {
    return (value) => (value ? '' : t('auth.validation.required', { label }))
  },
  // optional fields: empty is fine, a value must match
  phone(value) {
    if (!value.trim()) return ''
    return PHONE.test(value.trim()) ? '' : t('auth.validation.phoneInvalid', { example: '012345678' })
  },
  avatar(value) {
    return value.length > 500 ? t('auth.validation.avatarMax', { max: 500 }) : ''
  },
  // article fields
  title(value) {
    if (!value.trim()) return t('auth.validation.titleBlank')
    return value.trim().length > 255 ? t('auth.validation.titleMax', { max: 255 }) : ''
  },
  summary(value) {
    return value.length > 1000 ? t('auth.validation.summaryMax', { max: 1000 }) : ''
  },
  content(value) {
    return value.length > 500000 ? t('auth.validation.contentTooLong') : ''
  },
  // an image to upload: the backend accepts JPEG, PNG, GIF and WebP up to 5 MB
  imageFile(file) {
    if (!file) return t('auth.validation.imageChoose')
    if (!IMAGE_TYPES.includes(file.type)) return t('auth.validation.imageType')
    return file.size > UPLOAD_MAX_BYTES ? t('auth.validation.imageTooLarge', { max: 5 }) : ''
  },
  // category / tag name: required, at most 100 characters
  name(value) {
    if (!value.trim()) return t('auth.validation.nameBlank')
    return value.trim().length > 100 ? t('auth.validation.nameMax', { max: 100 }) : ''
  },
  // optional: empty means "generate from the name"
  slug(value) {
    if (!value) return ''
    if (value.length > 150) return t('auth.validation.slugMax', { max: 150 })
    return SLUG.test(value) ? '' : t('auth.validation.slugInvalid')
  },
  description(value) {
    return value.length > 500 ? t('auth.validation.descriptionMax', { max: 500 }) : ''
  },
  otp(value) {
    return OTP.test(value) ? '' : t('auth.validation.otpInvalid', { length: OTP_LENGTH })
  },
}

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean)
}

// the backend treats an empty optional text as "not set"
export function blankToNull(value) {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}
