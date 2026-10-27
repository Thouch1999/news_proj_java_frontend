import { useCallback } from 'react'
import { sendVideoComplete, sendVideoPlay } from '../services/promoService'

// "pageView|promo|placement|kind" of the video events already sent: one play and one completion per promo and placement for
// each page view (a looping video would otherwise count at every turn)
const sent = new Set()

// Returns { reportPlay, reportComplete }: call them when the video starts and when it reaches its end (or 95% of a loop).
// Each sends its event once per page view. Without a promo id (the admin preview) they do nothing.
export function usePromoVideoEvents(promoId, placement, pageView) {
  const once = useCallback(
    (kind, send) => {
      if (promoId === undefined || promoId === null) return
      const key = `${pageView}|${promoId}|${placement}|${kind}`
      if (sent.has(key)) return
      sent.add(key)
      send(promoId, placement)
    },
    [promoId, placement, pageView],
  )
  const reportPlay = useCallback(() => once('play', sendVideoPlay), [once])
  const reportComplete = useCallback(() => once('complete', sendVideoComplete), [once])
  return { reportPlay, reportComplete }
}
