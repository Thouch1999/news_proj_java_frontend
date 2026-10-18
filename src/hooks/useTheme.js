import { useCallback, useEffect, useState } from 'react'
import { applyTheme, getStoredMode, resolveTheme, storeMode, THEME_EVENT, watchSystemTheme } from '../utils/theme'

// The colour mode of the page. `mode` is the choice (light, dark, system), `theme` what is shown now (light or dark).
export function useTheme() {
  const [mode, setModeState] = useState(getStoredMode)
  const [theme, setTheme] = useState(() => resolveTheme(getStoredMode()))

  useEffect(() => {
    applyTheme(mode)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolveTheme(mode))
    if (mode !== 'system') return undefined
    return watchSystemTheme(() => {
      applyTheme('system')
      setTheme(resolveTheme('system'))
    })
  }, [mode])

  // another control changed the mode
  useEffect(() => {
    const follow = (event) => setModeState(event.detail)
    window.addEventListener(THEME_EVENT, follow)
    return () => window.removeEventListener(THEME_EVENT, follow)
  }, [])

  const setMode = useCallback((next) => {
    storeMode(next)
    setModeState(next)
  }, [])

  return { mode, theme, setMode }
}
