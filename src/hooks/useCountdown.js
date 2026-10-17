import { useCallback, useEffect, useState } from 'react'

// Counts down once per second from the value given to start(); used for the OTP resend buttons.
export function useCountdown() {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) {
      return undefined
    }
    const timer = setTimeout(() => setRemaining((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining])

  const start = useCallback((seconds) => setRemaining(seconds), [])

  return { remaining, isRunning: remaining > 0, start }
}
