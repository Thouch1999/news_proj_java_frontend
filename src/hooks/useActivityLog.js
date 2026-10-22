import { useEffect, useState } from 'react'
import * as activityLogService from '../services/activityLogService'

// One page of the activity log for the given filters ({ actorId, actions, targetType, targetId, from, to, search }). It loads
// again when a filter, the page or the size changes, and when `reload()` is called; the rows stay on screen while it loads
// again. `enabled: false` loads nothing (for example while the date range is wrong).
// Returns { data, error, loading, reload }: data is { items, totalElements, totalPages, ... }.
export function useActivityLog({ filters, page, size, enabled = true }) {
  const key = JSON.stringify([filters, page, size])
  const [state, setState] = useState({ key: null, data: null, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    let current = true
    activityLogService
      .listActivity({ page, size, ...filters })
      .then((data) => current && setState({ key, data, error: null }))
      .catch((error) => current && setState({ key, data: null, error }))
    return () => {
      current = false
    }
    // `filters` is a new object on every render; `key` says when the request really changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, tick])

  const loading = enabled && state.key !== key
  return {
    data: enabled && !loading ? state.data : null,
    error: enabled && !loading ? state.error : null,
    loading,
    reload: () => setTick((value) => value + 1),
  }
}
