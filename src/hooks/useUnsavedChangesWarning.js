import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

// Warns before the user leaves a page with unsaved changes: closing the tab or reloading shows the browser's
// warning, and moving to another page inside the app is blocked until the page confirms (blocker.proceed()
// to leave, blocker.reset() to stay). Call markClean() right before navigating away after a successful save.
export function useUnsavedChangesWarning(dirty) {
  const dirtyRef = useRef(dirty)

  useEffect(() => {
    dirtyRef.current = dirty
  }, [dirty])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) {
      return undefined
    }
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  return {
    blocker,
    markClean: () => {
      dirtyRef.current = false
    },
  }
}
