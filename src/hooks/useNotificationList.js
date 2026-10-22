import { useEffect, useState } from 'react'
import * as notificationService from '../services/notificationService'
import { useNotifications } from './useNotifications'

// One page of the user's notifications. It loads again when the filter, page or size changes, and whenever the provider
// says something changed (`version`: a new notification arrived, one was read or deleted); the rows stay on screen
// while it loads again. `enabled: false` loads nothing (the panel of the bell is closed).
// Returns { data, error, loading, reload }: data is { items, totalElements, totalPages, ... }.
export function useNotificationList({ filter, page, size, enabled = true }) {
  const { version } = useNotifications()
  const key = `${filter}|${page}|${size}`
  const [state, setState] = useState({ key: null, data: null, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    let current = true
    notificationService
      .listNotifications({ filter, page, size })
      .then((data) => current && setState({ key, data, error: null }))
      .catch((error) => current && setState({ key, data: null, error }))
    return () => {
      current = false
    }
  }, [key, enabled, version, tick, filter, page, size])

  const loading = enabled && state.key !== key
  return {
    data: loading ? null : state.data,
    error: loading ? null : state.error,
    loading,
    reload: () => setTick((value) => value + 1),
  }
}
