const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

// How long an article has been waiting: { unit: 'less' | 'minute' | 'hour' | 'day', count, level }.
// level: 'normal' under 1 day, 'warn' from 1 day, 'danger' from 3 days.
export function waitingOf(since, now) {
  const elapsed = Math.max(0, now - new Date(since).getTime())
  const minutes = Math.floor(elapsed / MINUTE)
  let unit = 'day'
  let count = Math.floor(elapsed / DAY)
  if (minutes < 1) {
    unit = 'less'
    count = 0
  } else if (minutes < 60) {
    unit = 'minute'
    count = minutes
  } else if (elapsed < DAY) {
    unit = 'hour'
    count = Math.floor(minutes / 60)
  }
  return { unit, count, level: elapsed >= 3 * DAY ? 'danger' : elapsed >= DAY ? 'warn' : 'normal' }
}
