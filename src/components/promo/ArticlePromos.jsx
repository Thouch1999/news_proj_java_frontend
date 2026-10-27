import { useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { PLACEMENT_BAR, PLACEMENT_POPUP, PLACEMENT_SIDEBAR, POPUP_FALLBACK, POPUP_MIN_DELAY_SECONDS } from '../../constants/promo'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { usePromoImpression } from '../../hooks/usePromoImpression'
import { useRemoteData } from '../../hooks/useRemoteData'
import { useSettings } from '../../hooks/useSettings'
import * as promoService from '../../services/promoService'
import { isCrawler, markPopupShown, popupBlocked } from '../../utils/promo'
import { PromoBar, PromoPopupBody } from './PromoParts'
import { PromoSlideshow } from './PromoSlideshow'

// The promos of the article page, and only there: one in the sidebar, and on top of the page a popup (tablet and computer)
// or a bottom bar (phone), both only after the reader has read a part of the article or waited. Nothing is shown to search
// engine bots, in the dashboard or inside the article text. A promo is counted when it was really seen (usePromoImpression).
// `pageView` is an id that is new for every article that opens: it limits the counting to once per promo and placement.

const language = (i18n) => (i18n.language === 'km' ? 'km' : 'en')

// loads a promo for a placement; `on` false loads nothing. Returns the promo or null (nothing, an error, or none to show).
function usePromo(placement, article, on) {
  const { i18n } = useTranslation()
  const lang = language(i18n)
  const key = on ? `promo|${placement}|${article.category?.slug}|${lang}|${article.id}` : 'promo|off'
  const { data } = useRemoteData(key, () => (on ? promoService.getPromo({ placement, categorySlug: article.category?.slug, lang }).catch(() => null) : Promise.resolve(null)))
  return data ?? null
}

// ---- the sidebar slot: the top of the sticky sidebar. Nothing (not an empty box) when there is no promo. ----

// The answer for the sidebar is { layout, perSlide, rotate, intervalSeconds, items }: a slideshow of several sponsors.
export function SidebarPromo({ article, pageView }) {
  const { promos } = useSettings()
  const on = promos.enabled && !isCrawler()
  const data = usePromo(PLACEMENT_SIDEBAR, article, on)
  if (!Array.isArray(data?.items) || data.items.length === 0) return null
  return <PromoSlideshow items={data.items} layout={data.layout} perSlide={data.perSlide} rotate={data.rotate} intervalSeconds={data.intervalSeconds} pageView={pageView} />
}

// ---- the popup (>= 768px) or the bottom bar (below), after the reader has scrolled or waited ----

// true when the rules of the popup say it is time: after `delay` seconds (trigger DELAY), after the reader scrolled `percent` of
// the article (SCROLL, the article element is `article.article-page`), or whichever comes first (FIRST_OF_BOTH). Never at page
// load: a real scroll is needed for the scroll rule, and the delay is never below POPUP_MIN_DELAY_SECONDS.
function useReadyToShow(on, rules) {
  const [ready, setReady] = useState(false)
  const { trigger, delaySeconds, scrollPercent } = rules

  useEffect(() => {
    if (!on || ready) return undefined
    const byDelay = trigger !== 'SCROLL'
    const byScroll = trigger !== 'DELAY'
    const timer = byDelay ? setTimeout(() => setReady(true), Math.max(delaySeconds, POPUP_MIN_DELAY_SECONDS) * 1000) : null
    const onScroll = () => {
      const article = document.querySelector('article.article-page')
      if (!article || window.scrollY <= 0) return
      const { top, height } = article.getBoundingClientRect()
      if (height > 0 && ((window.innerHeight - top) / height) * 100 >= scrollPercent) setReady(true)
    }
    if (byScroll) window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [on, ready, trigger, delaySeconds, scrollPercent])

  return ready
}

export function OverlayPromo({ article, pageView }) {
  const { t } = useTranslation()
  const { promos } = useSettings()
  const desktop = useMediaQuery('(min-width: 768px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const placement = desktop ? PLACEMENT_POPUP : PLACEMENT_BAR
  // on a phone the bar takes the place of the popup, so the popup switch turns both off
  const allowed = promos.enabled && promos.popupEnabled && !isCrawler()
  const promo = usePromo(placement, article, allowed)
  const rules = promo?.popup ?? POPUP_FALLBACK
  // The memory of this sponsor, read once when its promo arrives (showing it marks the day, which must not hide it again). The
  // popup and the bar of a sponsor share it. A blocked sponsor shows nothing.
  const blocked = useMemo(() => (promo ? popupBlocked(promo.id, rules) : false), [promo?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const ready = useReadyToShow(Boolean(promo) && !blocked, rules)
  const [dismissed, setDismissed] = useState(false)
  // one popup (or bar) per page view: the first one that was shown stays the only one
  const [shownAs, setShownAs] = useState(null)
  const show = Boolean(promo) && !blocked && ready && !dismissed && (shownAs ?? placement) === placement
  const ref = usePromoImpression(show ? promo : null, placement, pageView)

  // the first placement that is shown is remembered (state set while rendering, the pattern for a value derived from a change)
  if (show && shownAs === null) setShownAs(placement)
  const sponsorId = promo?.id
  useEffect(() => {
    if (show) markPopupShown(sponsorId, rules)
  }, [show, sponsorId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return null
  const close = () => setDismissed(true)

  if (desktop) {
    return (
      <Modal show onHide={close} centered animation={!reducedMotion} dialogClassName="promo-dialog" contentClassName="promo-modal promo-scope" aria-label={t('public.promo.popupLabel')}>
        {/* the close button floats over the media, always visible; the label is on the media */}
        <Modal.Header closeButton closeLabel={t('common.actions.close')} />
        <Modal.Body>
          <PromoPopupBody promo={promo} innerRef={ref} onOpen={close} pageView={pageView} />
        </Modal.Body>
      </Modal>
    )
  }
  return <PromoBar promo={promo} innerRef={ref} onClose={close} />
}
