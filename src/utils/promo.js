// Helpers of the promos: crawler check, the memory of the popups shown, and the dates of the admin form.
import { PLACEMENT_POPUP, POPUP_SEEN_KEY } from '../constants/promo'

// Search engine bots and link previews never get a promo (they would not count, and a promo must not be indexed)
const CRAWLER = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|inspectiontool/i

export function isCrawler() {
  return typeof navigator === 'undefined' || CRAWLER.test(navigator.userAgent ?? '')
}

// today in the reader's calendar, yyyy-MM-dd
export function todayKey(now = new Date()) {
  const pad = (number) => String(number).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const DAY = 24 * 60 * 60 * 1000

// whole days from one yyyy-MM-dd to another (calendar days, no time zone or summer time effect)
function daysBetween(from, to) {
  const parse = (key) => {
    const [year, month, day] = key.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  return Math.round((parse(to) - parse(from)) / DAY)
}

const seenKey = (sponsorId) => `${POPUP_SEEN_KEY}-${sponsorId}`

// Whether the rules say this reader must not see the popup of this sponsor yet: PER_VISIT never blocks, PER_DAY blocks for
// the rest of the day it was shown, EVERY_N_DAYS until N days have passed. Blocked storage counts as "not shown".
export function popupBlocked(sponsorId, rules, now = new Date()) {
  if (rules.frequency === 'PER_VISIT') return false
  let last = null
  try {
    last = localStorage.getItem(seenKey(sponsorId))
  } catch {
    return false
  }
  if (!last || !/^\d{4}-\d{2}-\d{2}$/.test(last)) return false
  const passed = daysBetween(last, todayKey(now))
  if (rules.frequency === 'EVERY_N_DAYS') return passed < Math.max(1, rules.frequencyDays)
  return passed < 1 // PER_DAY; a date in the future (a changed clock) also blocks, which is the safe side
}

// Remembers that the popup (or the bar) of this sponsor was shown today, unless it is shown at every visit.
export function markPopupShown(sponsorId, rules, now = new Date()) {
  if (rules.frequency === 'PER_VISIT') return
  try {
    localStorage.setItem(seenKey(sponsorId), todayKey(now))
  } catch {
    // blocked storage: the popup may come back on the next page, which is acceptable
  }
}

// ---- the dates of the admin form: the fields show the local time, the backend takes UTC ----

// "2026-11-01T00:00:00Z" -> "2026-11-01T07:00" (the value of <input type="datetime-local">); '' for none
export function toLocalInput(utc) {
  if (!utc) return ''
  const date = new Date(utc)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// "2026-11-01T07:00" (local time) -> "2026-11-01T00:00:00.000Z"; null for none
export function toUtc(localValue) {
  if (!localValue) return null
  const date = new Date(localValue)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/

// The ID of a YouTube promo, only when it has the right shape (the embed address is built from nothing else), else null
export const youtubeIdOf = (promo) => (YOUTUBE_ID.test(promo.youtubeId ?? '') ? promo.youtubeId : null)

// Whether the promo shows a video in this placement (so the media goes outside the click link and the buttons of the player
// do not follow it). A YouTube promo in the sidebar is not a video: its poster is shown as a picture.
export function hasVideo(promo, placement) {
  if (promo.mediaType === 'VIDEO_FILE') return Boolean(promo.videoUrl)
  return promo.mediaType === 'YOUTUBE' && placement === PLACEMENT_POPUP && Boolean(youtubeIdOf(promo))
}
