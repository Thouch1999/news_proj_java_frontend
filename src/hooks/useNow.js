import { useEffect, useState } from 'react'

// The current time in milliseconds, renewed every `every` milliseconds (a minute by default), for texts such as "Waiting 3 hours"
export function useNow(every = 60000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(timer)
  }, [every])
  return now
}
