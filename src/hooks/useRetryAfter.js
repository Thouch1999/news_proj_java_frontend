import { useEffect, useState } from 'react'
import { secondsLeft } from '../utils/retryAfter'

// Seconds left until the user may try again after a failed call (an ApiError with retryAfterSeconds), counting down live;
// 0 when there is no such error or the time has passed. A form disables its submit button while this is above 0:
//   const retry = useRetryAfter(apiError)   <Button disabled={submitting || retry > 0}>
// The button is enabled again by itself when the countdown ends.
export function useRetryAfter(error) {
  const [, setTick] = useState(0)
  const until = error?.retryUntil ?? null

  useEffect(() => {
    if (!until || until <= Date.now()) {
      return undefined
    }
    const timer = setInterval(() => {
      setTick((tick) => tick + 1)
      if (Date.now() >= until) {
        clearInterval(timer)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [until])

  return secondsLeft(error)
}
