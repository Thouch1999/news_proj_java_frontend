// Colour mode: 'light', 'dark' or 'system' (follows prefers-color-scheme). The choice is saved in localStorage and put on
// <html data-bs-theme="..."> (Bootstrap 5.3 color modes). index.html has a small copy of getStoredMode/resolveTheme/
// applyTheme that runs before the first render, so the page does not flash the wrong theme: keep the two in sync.
export const THEME_MODES = ['light', 'dark', 'system']
export const THEME_KEY = 'news-theme'
// storeMode announces the new choice on window, so every control that shows the mode (header, profile preferences) follows
export const THEME_EVENT = 'news-theme-change'

const query = () => window.matchMedia('(prefers-color-scheme: dark)')

export function getStoredMode() {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return THEME_MODES.includes(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

export function storeMode(mode) {
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {
    // private window or blocked storage: the choice just lasts until the page is closed
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: mode }))
}

export function resolveTheme(mode) {
  if (mode === 'system') return query().matches ? 'dark' : 'light'
  return mode
}

export function applyTheme(mode) {
  document.documentElement.setAttribute('data-bs-theme', resolveTheme(mode))
}

// Calls `listener` when the operating system changes between light and dark. Returns the function that stops it.
export function watchSystemTheme(listener) {
  const media = query()
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}
