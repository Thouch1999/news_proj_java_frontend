import { useEffect, useRef, useState } from 'react'

const GRACE_MS = 65000 // the backend job publishes the due articles once a minute
const RETRY_MS = 30000 // an article still scheduled after its time: the job is late, ask again
const LONGEST_WAIT_MS = 3600000 // a timer is never set for longer than this (an article may be a year away)

// The backend has no live stream of its changes, so a list that shows SCHEDULED articles asks for itself again just after
// the earliest go-live time (the job publishes within a minute of it), then again while one is still there. `times` are the
// go-live times (ISO strings) shown now; `refresh` loads the list again. Nothing runs while `times` is empty.
export function useRefreshWhenDue(times, refresh) {
  const [round, setRound] = useState(0)
  const latest = useRef(refresh)
  useEffect(() => {
    latest.current = refresh
  })

  const key = times.join('|')
  useEffect(() => {
    const due = Math.min(...key.split('|').filter(Boolean).map((value) => Date.parse(value)).filter((value) => !Number.isNaN(value)))
    if (!Number.isFinite(due)) return undefined
    const wait = Date.now() >= due ? RETRY_MS : Math.min(due + GRACE_MS - Date.now(), LONGEST_WAIT_MS)
    const timer = setTimeout(() => {
      if (Date.now() >= due + GRACE_MS - 1000) latest.current()
      setRound((value) => value + 1) // arms the next wait
    }, Math.max(wait, 1000))
    return () => clearTimeout(timer)
  }, [key, round])
}
