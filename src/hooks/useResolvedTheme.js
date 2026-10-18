import { useSyncExternalStore } from 'react'

const read = () => document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light'

function subscribe(callback) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] })
  return () => observer.disconnect()
}

// The colour mode that is on the page now ('light' or 'dark'), for every component: it follows <html data-bs-theme>, so a
// change made by the theme toggle (or by the operating system in the System mode) reaches all of them.
export function useResolvedTheme() {
  return useSyncExternalStore(subscribe, read, () => 'light')
}
