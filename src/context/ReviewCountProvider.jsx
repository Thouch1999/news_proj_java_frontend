import { useCallback, useEffect, useMemo, useState } from 'react'
import * as newsService from '../services/newsService'
import { ReviewCountContext } from './ReviewCountContext'

// Keeps the number of PENDING articles for editors and admins (`enabled`). It loads it once, and the pages that know a
// newer number say it with setCount (the dashboard, the review queue) or ask for a fresh one with refresh() (after a
// publish or a reject).
export default function ReviewCountProvider({ enabled, children }) {
  const [count, setCount] = useState(null)

  const refresh = useCallback(async () => {
    if (!enabled) return
    try {
      const page = await newsService.listReviewQueue({ page: 1, size: 1 })
      setCount(page.totalElements)
    } catch {
      // the badge keeps its last number
    }
  }, [enabled])

  // the first number
  useEffect(() => {
    if (!enabled) return undefined
    let current = true
    newsService
      .listReviewQueue({ page: 1, size: 1 })
      .then((page) => current && setCount(page.totalElements))
      .catch(() => {
        // no badge until a page knows the number
      })
    return () => {
      current = false
    }
  }, [enabled])

  const value = useMemo(() => ({ count, refresh, setCount }), [count, refresh])
  return <ReviewCountContext.Provider value={value}>{children}</ReviewCountContext.Provider>
}
