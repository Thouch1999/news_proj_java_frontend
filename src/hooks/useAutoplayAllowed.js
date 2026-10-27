import { useMediaQuery } from './useMediaQuery'

// A promo video plays by itself only for a reader on a computer who did not ask to save data or to reduce motion
export function useAutoplayAllowed() {
  const small = useMediaQuery('(max-width: 767.98px), (pointer: coarse)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const saveData = typeof navigator !== 'undefined' && Boolean(navigator.connection?.saveData)
  return !small && !reducedMotion && !saveData
}
