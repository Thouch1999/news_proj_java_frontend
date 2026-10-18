import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_PRESET, RANGE_PRESETS, resolveRange } from '../utils/dashboardRange'

// The date range of a dashboard, kept in the URL (?range=7d|month|year, or ?range=custom&from=...&to=...; no parameter
// means the last 30 days), so a reload or a shared link shows the same period.
// Returns { preset, from, to, days, problem, setPreset, setCustom } where from/to are what the reports use.
export function useDashboardRange() {
  const [params, setParams] = useSearchParams()
  const asked = params.get('range')
  const preset = RANGE_PRESETS.includes(asked) ? asked : DEFAULT_PRESET
  const customFrom = params.get('from') ?? ''
  const customTo = params.get('to') ?? ''
  const range = useMemo(() => resolveRange(preset, customFrom, customTo), [preset, customFrom, customTo])

  const write = useCallback(
    (changes) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  // a new preset; "custom" starts from the dates that are shown now
  const setPreset = useCallback(
    (next) => {
      if (next === 'custom') write({ range: 'custom', from: range.from, to: range.to })
      else write({ range: next === DEFAULT_PRESET ? '' : next, from: '', to: '' })
    },
    [write, range.from, range.to],
  )
  const setCustom = useCallback((changes) => write({ range: 'custom', ...changes }), [write])

  return { ...range, customFrom, customTo, setPreset, setCustom }
}
