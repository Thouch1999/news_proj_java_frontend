import { FAVICON_TYPES, IMAGE_MAX_BYTES, IMAGE_TYPES, SETTING_RULES } from '../constants/siteSettings'
import i18n from '../i18n'

const t = (key, options) => i18n.t(`dashboard.settings.validation.${key}`, options)

const COLOR = /^#[0-9A-Fa-f]{6}$/
const EMAIL = /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/
const WHOLE_NUMBER = /^\d{1,9}$/

// The value as the backend saves it: line breaks unified, the ends trimmed
export function cleanSetting(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
}

// a control character (below a space, or DEL); a multi-line text may hold tabs and line breaks
function hasControlCharacters(value, allowLineBreaks) {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    const control = code < 32 || code === 127
    return control && !(allowLineBreaks && (code === 10 || code === 9))
  })
}

function isHttpsUrl(value) {
  if (/\s/.test(value) || hasControlCharacters(value, false)) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

// The same checks as the backend (SettingValueValidator); returns the problem as a sentence, or '' when the value is fine.
// The backend still decides: its answer is shown under the field too.
export function validateSetting(key, rawValue) {
  const rule = SETTING_RULES[key]
  if (!rule) return ''
  const value = cleanSetting(rawValue)
  if (!value) return rule.required ? t('required') : ''
  if (rule.max && value.length > rule.max) return t('max', { max: rule.max })
  if (/[<>]/.test(value)) return t('plainText')
  if (hasControlCharacters(value, Boolean(rule.multiline))) return rule.multiline ? t('badCharacters') : t('singleLine')
  switch (rule.type) {
    case 'color':
      return COLOR.test(value) ? '' : t('color')
    case 'email':
      return EMAIL.test(value) ? '' : t('email')
    case 'url':
      return isHttpsUrl(value) ? '' : t('https')
    case 'number': {
      if (!WHOLE_NUMBER.test(value)) return t('wholeNumber')
      const number = Number.parseInt(value, 10)
      return number >= rule.min && number <= rule.max ? '' : t('range', { min: rule.min, max: rule.max })
    }
    case 'boolean':
      return value === 'true' || value === 'false' ? '' : t('boolean')
    default:
      break
  }
  if (rule.oneOf && !rule.oneOf.includes(value)) return t('oneOf', { values: rule.oneOf.join(', ') })
  return ''
}

// A site image before it is uploaded: PNG, JPG or WebP (the favicon also ICO), 2 MB at most
export function validateSettingsImage(file, type) {
  if (!file) return t('imageChoose')
  const allowed = type === 'favicon' ? FAVICON_TYPES : IMAGE_TYPES
  const icoByName = type === 'favicon' && /\.ico$/i.test(file.name)
  if (!allowed.includes(file.type) && !icoByName) return t(type === 'favicon' ? 'faviconType' : 'imageType')
  return file.size > IMAGE_MAX_BYTES ? t('imageTooLarge', { max: IMAGE_MAX_BYTES / (1024 * 1024) }) : ''
}
