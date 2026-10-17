// Dates from the API are ISO strings without a time zone (for example 2026-03-05T09:00:00).

export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''
}

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : ''
}
