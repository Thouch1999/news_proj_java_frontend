import { useSyncExternalStore } from 'react'

// true while the screen matches the media query, for example useMediaQuery('(max-width: 767.98px)')
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', notify)
      return () => media.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
