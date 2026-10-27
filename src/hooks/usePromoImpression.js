import { useEffect, useState } from 'react'
import { VIEW_MILLISECONDS, VIEW_RATIO } from '../constants/promo'
import { sendImpression } from '../services/promoService'

// "pageView|promo|placement" of the impressions already sent: one per promo and placement for each page view
const counted = new Set()

// Counts an impression when at least half of the promo is visible for one second while the tab is in front (an
// IntersectionObserver and a timer). Returns a callback ref to put on the element to watch; it works for an element that
// mounts later (a popup). `pageView` is the id of the page view (a new one for every article that opens). Without a
// promo (or in the admin preview, which does not use this hook) nothing is counted.
export function usePromoImpression(promo, placement, pageView) {
  const [node, setNode] = useState(null)
  const id = promo?.id

  useEffect(() => {
    if (!node || id === undefined || typeof IntersectionObserver === 'undefined') return undefined
    const key = `${pageView}|${id}|${placement}`
    if (counted.has(key)) return undefined

    let timer = null
    const stop = () => {
      clearTimeout(timer)
      timer = null
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= VIEW_RATIO) {
          if (timer === null) {
            timer = setTimeout(() => {
              timer = null
              if (document.visibilityState !== 'visible' || counted.has(key)) return
              counted.add(key)
              sendImpression(id, placement)
              observer.disconnect()
            }, VIEW_MILLISECONDS)
          }
        } else {
          stop()
        }
      },
      { threshold: [0, VIEW_RATIO, 1] },
    )
    observer.observe(node)
    return () => {
      stop()
      observer.disconnect()
    }
  }, [node, id, placement, pageView])

  return setNode
}
