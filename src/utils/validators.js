// Client-side rules that mirror the backend request validation (Jakarta annotations).
// Each rule returns an error text, or '' when the value is valid.
import { OTP_LENGTH } from '../constants/otp'
import { IMAGE_TYPES, UPLOAD_MAX_BYTES } from '../constants/upload'

const EMAIL = /^[^\s@]+@[^\s@]+$/
const USERNAME = /^[a-zA-Z\s]+$/
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const PHONE = /^0[1-9][0-9]{7,8}$/
const OTP = new RegExp(`^\\d{${OTP_LENGTH}}$`)

export const rules = {
  email(value) {
    if (!value.trim()) return 'Email can not be blank'
    return EMAIL.test(value.trim()) ? '' : 'Invalid email address'
  },
  username(value) {
    if (!value.trim()) return 'Name can not be blank'
    return USERNAME.test(value) ? '' : 'Username allows only English letters and spaces'
  },
  fullName(value) {
    return value.length > 255 ? 'Full name must be at most 255 characters' : ''
  },
  password(value) {
    if (!value) return 'Password can not be blank'
    return value.length >= 8 ? '' : 'Password must be at least 8 characters long'
  },
  confirm(password, value) {
    if (!value) return 'Confirm password can not be blank'
    return password === value ? '' : 'Confirm password does not match'
  },
  required(label) {
    return (value) => (value ? '' : `${label} can not be blank`)
  },
  // optional fields: empty is fine, a value must match
  phone(value) {
    if (!value.trim()) return ''
    return PHONE.test(value.trim()) ? '' : 'Invalid phone number (for example 012345678)'
  },
  avatar(value) {
    return value.length > 500 ? 'Avatar must be at most 500 characters' : ''
  },
  // article fields
  title(value) {
    if (!value.trim()) return 'Title can not be blank'
    return value.trim().length > 255 ? 'Title must be at most 255 characters' : ''
  },
  summary(value) {
    return value.length > 1000 ? 'Summary must be at most 1000 characters' : ''
  },
  content(value) {
    return value.length > 500000 ? 'Content is too long' : ''
  },
  // an image to upload: the backend accepts JPEG, PNG, GIF and WebP up to 5 MB
  imageFile(file) {
    if (!file) return 'Choose an image'
    if (!IMAGE_TYPES.includes(file.type)) return 'Only JPEG, PNG, GIF and WebP images are allowed'
    return file.size > UPLOAD_MAX_BYTES ? 'The image is too large (5 MB at most)' : ''
  },
  // category / tag name: required, at most 100 characters
  name(value) {
    if (!value.trim()) return 'Name can not be blank'
    return value.trim().length > 100 ? 'Name must be at most 100 characters' : ''
  },
  // optional: empty means "generate from the name"
  slug(value) {
    if (!value) return ''
    if (value.length > 150) return 'Slug must be at most 150 characters'
    return SLUG.test(value) ? '' : 'Slug may only contain a-z, 0-9 and single hyphens'
  },
  description(value) {
    return value.length > 500 ? 'Description must be at most 500 characters' : ''
  },
  otp(value) {
    return OTP.test(value) ? '' : `OTP must be ${OTP_LENGTH} digits`
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
