// The date range of the dashboards: a preset or a custom range, as yyyy-MM-dd days (both included). The backend reports
// accept at most 366 days.
export const RANGE_PRESETS = ['7d', '30d', 'month', 'year', 'custom']
export const DEFAULT_PRESET = '30d'
export const MAX_RANGE_DAYS = 366

const DAY = 24 * 60 * 60 * 1000

function pad(number) {
  return String(number).padStart(2, '0')
}

export function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// A real calendar day from 'yyyy-MM-dd', or null
export function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '')
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

// Number of days from `from` to `to`, both included
export function countDays(from, to) {
  return Math.round((to.getTime() - from.getTime()) / DAY) + 1
}

function presetDates(preset, today) {
  const last = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (preset === '7d') return [new Date(last.getFullYear(), last.getMonth(), last.getDate() - 6), last]
  if (preset === 'month') return [new Date(last.getFullYear(), last.getMonth(), 1), last]
  if (preset === 'year') return [new Date(last.getFullYear(), 0, 1), last]
  return [new Date(last.getFullYear(), last.getMonth(), last.getDate() - 29), last] // 30d
}

// -> { preset, from, to, days, problem }. A custom range that is not complete or not valid falls back to the last 30
// days (the page keeps working) and `problem` says why: 'incomplete' | 'order' | 'tooLong'.
export function resolveRange(preset, customFrom, customTo, today = new Date()) {
  if (preset === 'custom') {
    const from = parseIsoDate(customFrom)
    const to = parseIsoDate(customTo)
    let problem = null
    if (!from || !to) problem = 'incomplete'
    else if (from > to) problem = 'order'
    else if (countDays(from, to) > MAX_RANGE_DAYS) problem = 'tooLong'
    if (!problem) return { preset, from: customFrom, to: customTo, days: countDays(from, to), problem: null }
    const [start, end] = presetDates(DEFAULT_PRESET, today)
    return { preset, from: toIsoDate(start), to: toIsoDate(end), days: countDays(start, end), problem }
  }
  const [start, end] = presetDates(preset, today)
  return { preset, from: toIsoDate(start), to: toIsoDate(end), days: countDays(start, end), problem: null }
}

// The change of a number against the same number of the previous period.
// -> { kind: 'up' | 'down' | 'flat' | 'none', percent }  ('none' when there is nothing to compare with)
export function trendOf(current, previous) {
  if (current == null || previous == null || previous === 0) return { kind: 'none', percent: 0 }
  const percent = Math.round((Math.abs(current - previous) / previous) * 100)
  if (current === previous || percent === 0) return { kind: 'flat', percent: 0 }
  return { kind: current > previous ? 'up' : 'down', percent }
}
