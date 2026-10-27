// Scheduled publishing: the time rules of the backend (5 minutes to 1 year ahead, UTC) and the helpers of the schedule
// dialog, which works in the local time of the browser. The backend decides; these only give the answer before the request.

export const SCHEDULE_MIN_MINUTES = 5
export const SCHEDULE_MAX_DAYS = 365

const MINUTE = 60000
const pad = (number) => String(number).padStart(2, '0')

// A Date as the value of <input type="date"> (yyyy-MM-dd) and <input type="time"> (HH:mm), in the local time zone
export const dateInputValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export const timeInputValue = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`

// The Date of the two input values (local time), or null when one is empty or not a real date
export function dateFromInputs(day, time) {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day ?? '')
  const clock = /^(\d{2}):(\d{2})$/.exec(time ?? '')
  if (!date || !clock) return null
  const result = new Date(Number(date[1]), Number(date[2]) - 1, Number(date[3]), Number(clock[1]), Number(clock[2]))
  return Number.isNaN(result.getTime()) ? null : result
}

// null when `date` may be scheduled at `now` (milliseconds), else 'required' | 'tooSoon' | 'tooFar'
export function scheduleProblem(date, now) {
  if (!date) return 'required'
  const ahead = date.getTime() - now
  if (ahead < SCHEDULE_MIN_MINUTES * MINUTE) return 'tooSoon'
  if (ahead > SCHEDULE_MAX_DAYS * 86400000) return 'tooFar'
  return null
}

// The quick choices that are inside the allowed window: [{ key, date }] with key tonight | tomorrow7 | tomorrow12 | monday.
// "Monday 07:00" is the next Monday (not today); when that is tomorrow it is the same time as "Tomorrow 07:00" and is left out.
export function quickChoices(now) {
  const today = new Date(now)
  const at = (days, hours) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + days, hours, 0)
  const untilMonday = ((8 - today.getDay()) % 7) || 7 // getDay(): Sunday 0 ... Monday 1
  const choices = [
    { key: 'tonight', date: at(0, 19) },
    { key: 'tomorrow7', date: at(1, 7) },
    { key: 'tomorrow12', date: at(1, 12) },
    { key: 'monday', date: at(untilMonday, 7) },
  ]
  const seen = new Set()
  return choices.filter(({ date }) => {
    const time = date.getTime()
    if (seen.has(time) || scheduleProblem(date, now)) return false
    seen.add(time)
    return true
  })
}

// "UTC+7", "UTC-3:30" for the offset of the browser at `date`
export function utcOffsetLabel(date) {
  const minutes = -date.getTimezoneOffset()
  const sign = minutes < 0 ? '-' : '+'
  const hours = Math.floor(Math.abs(minutes) / 60)
  const rest = Math.abs(minutes) % 60
  return `UTC${sign}${hours}${rest ? `:${pad(rest)}` : ''}`
}

// "Indochina Time, UTC+7": the name of the time zone of the browser (in the language of the page) and its offset
export function timeZoneLabel(locale, date) {
  let name = ''
  try {
    name = new Intl.DateTimeFormat(locale, { timeZoneName: 'long' }).formatToParts(date).find((part) => part.type === 'timeZoneName')?.value ?? ''
  } catch {
    name = ''
  }
  return name ? `${name}, ${utcOffsetLabel(date)}` : utcOffsetLabel(date)
}

// The unit and the number for "in 14 hours": minutes under 2 hours, hours under 2 days, else days
export function untilParts(ms) {
  const minutes = Math.max(1, Math.round(ms / MINUTE))
  if (minutes < 120) return [minutes, 'minute']
  const hours = Math.round(minutes / 60)
  if (hours < 48) return [hours, 'hour']
  return [Math.round(hours / 24), 'day']
}
