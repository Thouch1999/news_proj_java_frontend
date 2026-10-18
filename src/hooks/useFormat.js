import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { intlLocale } from '../i18n'

// Dates and numbers in the selected language (Khmer month names in Khmer mode). Dates from the API are ISO strings
// without a time zone (for example 2026-03-05T09:00:00). The hook re-renders the component when the language changes.
// Returns { formatDate, formatDateTime, formatNumber, formatPercent, formatMonth, formatDay, formatLongDate, formatFullDate, formatAgo, locale }.
export function useFormat() {
  const { i18n } = useTranslation()
  const locale = intlLocale(i18n.language)

  const formatDate = useCallback((value) => (value ? new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }) : ''), [locale])
  const formatDateTime = useCallback((value) => (value ? new Date(value).toLocaleString(locale) : ''), [locale])
  const formatNumber = useCallback((value) => Number(value ?? 0).toLocaleString(locale), [locale])
  // 'Mar 26' style label for a month (year, month 1-12), and 'Mar 5' for a yyyy-MM-dd day
  const formatMonth = useCallback((year, month) => new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'short', year: '2-digit' }), [locale])
  const formatDay = useCallback((value) => new Date(`${value}T00:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric' }), [locale])

  // 12 -> '12%'
  const formatPercent = useCallback((value) => `${Number(value ?? 0).toLocaleString(locale)}%`, [locale])
  // 'Saturday, 17 October 2026' (a Date or an ISO string)
  const formatLongDate = useCallback((value) => new Date(value).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), [locale])
  // 'Oct 17, 2026, 15:29' (date and time, 24 hours)
  const formatFullDate = useCallback((value) => new Date(value).toLocaleString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }), [locale])
  // '5 minutes ago', 'yesterday' ... in the selected language; a time a little in the future (clock difference) is 'now'
  const formatAgo = useCallback(
    (value) => {
      const seconds = Math.min(0, (new Date(value).getTime() - Date.now()) / 1000)
      const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
      const steps = [
        ['minute', 60],
        ['hour', 3600],
        ['day', 86400],
        ['month', 2592000],
        ['year', 31536000],
      ]
      if (Math.abs(seconds) < 60) return formatter.format(0, 'second')
      let [unit, size] = steps[0]
      for (const step of steps) {
        if (Math.abs(seconds) >= step[1]) [unit, size] = step
      }
      return formatter.format(Math.round(seconds / size), unit)
    },
    [locale],
  )

  return useMemo(
    () => ({ formatDate, formatDateTime, formatNumber, formatPercent, formatMonth, formatDay, formatLongDate, formatFullDate, formatAgo, locale }),
    [formatDate, formatDateTime, formatNumber, formatPercent, formatMonth, formatDay, formatLongDate, formatFullDate, formatAgo, locale],
  )
}
