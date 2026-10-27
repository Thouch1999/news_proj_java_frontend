import { IMAGE_MAX_BYTES, IMAGE_TYPES } from '../constants/siteSettings'
import { MEDIA_IMAGE, MEDIA_VIDEO, MEDIA_YOUTUBE, OPTIONS_FALLBACK, PARTNER_MAX, PLACEMENT, VIDEO_FILE_TYPES, WEIGHT_MAX, WEIGHT_MIN } from '../constants/promo'
import i18n from '../i18n'

// The checks of the sponsor form, the same as the backend's (SponsorValidator); the backend decides, and its answer is
// shown under the field too.
const t = (key, options) => i18n.t(`dashboard.partners.errors.${key}`, options)

// an https address with a host, no spaces, no control characters, no user info
export function isHttpsUrl(value) {
  if (/\s/.test(value) || [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

function plainText(value, max, required) {
  const text = value.trim()
  if (!text) return required ? t('required') : ''
  if (text.length > max) return t('max', { max })
  if (/[<>]/.test(text)) return t('plainText')
  if ([...text].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return t('singleLine')
  return ''
}

// The popup timing of a sponsor that does not use the site defaults, against the limits of the backend (`limits` comes from
// GET /api/v1/admin/promos/options). The delay is needed unless the popup waits for a scroll only, the scroll unless it waits for
// a delay only, the days only for "once every N days"; a number that is sent is checked in any case.
export function validateTiming(form, limits = OPTIONS_FALLBACK.limits) {
  const found = {}
  const whole = (value) => value !== '' && value !== null && value !== undefined && Number.isInteger(Number(value))
  const range = (field, value, min, max, needed, key) => {
    const given = value !== '' && value !== null && value !== undefined
    if (!given) {
      if (needed) found[field] = t(key, { min, max })
    } else if (!whole(value) || Number(value) < min || Number(value) > max) {
      found[field] = t(key, { min, max })
    }
  }
  if (!form.popupTrigger) found.popupTrigger = t('required')
  if (!form.popupFrequency) found.popupFrequency = t('required')
  range('popupDelaySeconds', form.popupDelaySeconds, limits.popupDelayMin, limits.popupDelayMax, form.popupTrigger !== 'SCROLL', 'popupDelay')
  range('popupScrollPercent', form.popupScrollPercent, limits.popupScrollMin, limits.popupScrollMax, form.popupTrigger !== 'DELAY', 'popupScroll')
  range('popupFrequencyDays', form.popupFrequencyDays, limits.popupFrequencyDaysMin, limits.popupFrequencyDaysMax, form.popupFrequency === 'EVERY_N_DAYS', 'popupDays')
  return found
}

// -> { field: problem } for the fields that are wrong (empty object: fine). `form` is the state of the form page.
export function validatePartner(form, limits = OPTIONS_FALLBACK.limits) {
  const found = {
    name: plainText(form.name, PARTNER_MAX.name, true),
    title: plainText(form.title, PARTNER_MAX.title, true),
    description: plainText(form.description, PARTNER_MAX.description, false),
    ctaText: plainText(form.ctaText, PARTNER_MAX.ctaText, true),
  }
  const url = form.targetUrl.trim()
  if (!url) found.targetUrl = t('required')
  else if (url.length > PARTNER_MAX.targetUrl) found.targetUrl = t('max', { max: PARTNER_MAX.targetUrl })
  else if (!isHttpsUrl(url)) found.targetUrl = t('https')

  if (!form.placements?.length) found.placements = t('placements')

  const weight = Number(form.weight)
  if (!Number.isInteger(weight) || weight < WEIGHT_MIN || weight > WEIGHT_MAX) found.weight = t('weight', { min: WEIGHT_MIN, max: WEIGHT_MAX })
  if (form.startAt && form.endAt && new Date(form.endAt) <= new Date(form.startAt)) found.endAt = t('endAfterStart')
  if (!form.popupUseDefaults) Object.assign(found, validateTiming(form, limits))
  return Object.fromEntries(Object.entries(found).filter(([, problem]) => problem))
}

// What a chosen place is still missing, as { sidebarImage, popupImage } (the field of the place's media, whatever its type).
// `of(place)` gives the state of the place: { type (the chosen media type), saved (the stored creative or undefined),
// imageFile, videoFile, posterFile, youtubeUrl }. A type that differs from the stored one needs its new media; the same type
// keeps what is stored. A new video file needs its poster in the same step (the backend requires it).
export function validatePartnerMedia(places, of) {
  const found = {}
  const check = (place, key, imageKey) => {
    if (!places.includes(place)) return
    const { type, saved, imageFile, videoFile, posterFile, youtubeUrl } = of(place)
    const savedType = saved?.mediaType ?? null
    if (type === MEDIA_IMAGE) {
      if (!imageFile && savedType !== MEDIA_IMAGE) found[key] = savedType ? t('imageForVideo') : t(imageKey)
    } else if (type === MEDIA_VIDEO) {
      if (videoFile && !posterFile) found[key] = t('posterRequired')
      else if (!videoFile && savedType !== MEDIA_VIDEO) found[key] = t('videoRequired')
    } else if (type === MEDIA_YOUTUBE && !youtubeUrl.trim()) {
      found[key] = t('youtubeRequired')
    }
  }
  check('ARTICLE_SIDEBAR', 'sidebarImage', 'sidebarImage')
  check('ARTICLE_POPUP', 'popupImage', 'popupImage')
  return found
}

// A chosen video file before it is uploaded: MP4 or WebM, at most `limits.videoMaxBytes`. The duration and the codec are checked
// by the backend (the page also reads the duration, see readVideoSeconds). Returns the problem, or ''.
export function validatePartnerVideo(file, limits = OPTIONS_FALLBACK.limits) {
  const typeOk = VIDEO_FILE_TYPES.includes(file.type) || (!file.type && /\.(mp4|webm)$/i.test(file.name))
  if (!typeOk) return i18n.t('dashboard.partners.media.errors.videoType')
  return file.size > limits.videoMaxBytes ? i18n.t('dashboard.partners.media.errors.videoTooLarge', { max: Math.round(limits.videoMaxBytes / (1024 * 1024)) }) : ''
}

// The duration of a chosen video in seconds, read by the browser from the file; null when it cannot be read (a codec this
// browser does not play): then only the backend decides. `src` is an object URL of the file.
export function readVideoSeconds(src) {
  return new Promise((resolve) => {
    const probe = document.createElement('video')
    const done = (value) => {
      probe.removeAttribute('src')
      probe.load()
      resolve(value)
    }
    probe.preload = 'metadata'
    probe.muted = true
    probe.onloadedmetadata = () => done(Number.isFinite(probe.duration) ? probe.duration : null)
    probe.onerror = () => done(null)
    probe.src = src
  })
}

// A chosen image before it is uploaded: PNG, JPG or WebP, 2 MB at most. Returns the problem, or ''.
export function validatePartnerImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) return i18n.t('dashboard.partners.images.type')
  return file.size > IMAGE_MAX_BYTES ? i18n.t('dashboard.partners.images.tooLarge', { max: IMAGE_MAX_BYTES / (1024 * 1024) }) : ''
}

// A warning (not an error) when the picture is smaller than the size to upload or has another shape. `size` is { width, height }.
export function imageSizeWarning(placementId, size) {
  const placement = PLACEMENT[placementId]
  if (!size || !placement) return ''
  const ratio = size.width / size.height
  const wanted = placement.uploadWidth / placement.uploadHeight
  const sharp = size.width >= placement.uploadWidth && size.height >= placement.uploadHeight
  if (sharp && Math.abs(ratio - wanted) / wanted < 0.05) return ''
  return i18n.t('dashboard.partners.images.sizeWarning', { width: size.width, height: size.height, uploadWidth: placement.uploadWidth, uploadHeight: placement.uploadHeight })
}
