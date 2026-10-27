import httpClient, { API_BASE_URL } from './httpClient'

const PROMOS = '/api/v1/promos'

// The promos of the public pages (no login). The path says "promos" because ad blockers block "ads" and "sponsor".
//
// A promo: { id, placement, title, description, ctaText, label ('Sponsored'), imageUrl (/uploads/...), width, height,
//   altText, clickUrl (a path of the backend: opening it counts the click and redirects to the partner) }

// The sidebar (ARTICLE_SIDEBAR) answers a slideshow instead of one promo:
//   { layout: 'LIST_1' | 'GRID_2' | 'LOGOS_4', perSlide, rotate, intervalSeconds, items: [promo] } (up to 24 different sponsors in
//   weighted-random order; imageUrl is the image of the layout: the sidebar picture, or the square logo for LOGOS_4).
// Also: mediaType, videoUrl, youtubeId and (popup and bar) popup rules on a promo.

// One promo for ARTICLE_POPUP | MOBILE_BOTTOM_BAR (the slideshow object for ARTICLE_SIDEBAR), or null when there is none or the
// settings turned them off. `categorySlug` is the category of the article, `lang` is en or km.
export function getPromo({ placement, categorySlug, lang }) {
  const params = { placement }
  if (categorySlug) params.categorySlug = categorySlug
  if (lang) params.lang = lang
  return httpClient.get(PROMOS, { params })
}

// Whether the backend is on the same address as the page. navigator.sendBeacon always sends the cookies, so the browser
// accepts its answer only from the same origin (the backend's CORS setting does not allow credentials).
function sameOrigin() {
  try {
    return new URL(API_BASE_URL, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

// Counts one event of a promo (impression, video-play, video-complete). It survives a page that is closing:
// navigator.sendBeacon where it works, otherwise a fetch with keepalive. Nothing is awaited and an error is ignored (a
// missed count must never disturb the page).
function sendEvent(id, placement, event) {
  const url = `${API_BASE_URL}${PROMOS}/${id}/${event}`
  const body = JSON.stringify({ placement })
  try {
    if (typeof navigator.sendBeacon === 'function' && sameOrigin() && navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))) {
      return
    }
  } catch {
    // fall back to fetch
  }
  try {
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true, credentials: 'omit' }).catch(() => {})
  } catch {
    // no fetch: nothing to do
  }
}

export function sendImpression(id, placement) {
  sendEvent(id, placement, 'impression')
}

// A video started to play / reached its end (ARTICLE_SIDEBAR or ARTICLE_POPUP: the phone bar has no video)
export function sendVideoPlay(id, placement) {
  sendEvent(id, placement, 'video-play')
}

export function sendVideoComplete(id, placement) {
  sendEvent(id, placement, 'video-complete')
}
