import i18n, { intlLocale } from '../i18n'

// Dates from the API are ISO strings without a time zone (for example 2026-03-05T09:00:00).
// These two read the language when they are called; components should prefer useFormat() (hooks/useFormat.js), which
// also re-renders them when the language changes.

export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(intlLocale(i18n.language), { year: 'numeric', month: 'short', day: 'numeric' }) : ''
}

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString(intlLocale(i18n.language)) : ''
}
