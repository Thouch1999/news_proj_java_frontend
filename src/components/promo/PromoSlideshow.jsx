import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { PLACEMENT_SIDEBAR, VIEW_RATIO } from '../../constants/promo'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { usePromoImpression } from '../../hooks/usePromoImpression'
import { PromoCard, PromoLogo, PromoTile } from './PromoParts'

// The sponsors of the article sidebar as one block: one small label, then slides of `perSlide` sponsors that change every
// `intervalSeconds` and loop. The order is the one of the answer (a weighted shuffle made by the backend).
//  - Layouts: LIST_1 large cards, GRID_2 tiles of 2 per row, LOGOS_4 square logos of 4 per row.
//  - The block keeps the height of its tallest slide: every slide sits in the same grid cell and only the current one shows.
//  - Rotation stops while the mouse is over the block, while focus is inside it, while less than half of it is visible and while the
//    tab is hidden; with prefers-reduced-motion there is none (dots and arrows only). One slide: no rotation and no controls.
//  - A sponsor is counted once per page view after 1 second at 50% visibility, and only while its slide is the current one
//    (usePromoImpression dedupes per page view, so looping never counts it again).
// With `preview` (the admin settings) nothing is counted and nothing is a link, but the rotation is real.
// `theme` (light or dark) is for a preview that shows both modes side by side.

const SWIPE_MIN = 40 // pixels

function chunk(items, size) {
  const slides = []
  for (let i = 0; i < items.length; i += size) slides.push(items.slice(i, i + size))
  return slides
}

// one sponsor in a slide: it is only counted while its slide is the current one
function SlideItem({ promo, layout, active, preview, pageView, theme }) {
  const ref = usePromoImpression(!preview && active ? promo : null, PLACEMENT_SIDEBAR, pageView)
  if (layout === 'LOGOS_4') return <PromoLogo promo={promo} preview={preview} innerRef={ref} />
  if (layout === 'GRID_2') return <PromoTile promo={promo} preview={preview} innerRef={ref} />
  // a video of a slide that is not shown stops: it is drawn as its poster (the same 16:9 box, so the height does not change)
  const shown = active || promo.mediaType !== 'VIDEO_FILE' ? promo : { ...promo, mediaType: 'IMAGE', ratio: '16 / 9' }
  return <PromoCard promo={shown} preview={preview} innerRef={ref} showLabel={false} pageView={pageView} theme={theme} />
}

export function PromoSlideshow({ items, layout = 'LIST_1', perSlide = 1, rotate = true, intervalSeconds = 8, preview = false, pageView, theme }) {
  const { t } = useTranslation()
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const root = useRef(null)
  const touch = useRef(null)
  const [index, setIndex] = useState(0)
  const [hover, setHover] = useState(false)
  const [focused, setFocused] = useState(false)
  const [onScreen, setOnScreen] = useState(true)
  const [tabHidden, setTabHidden] = useState(() => typeof document !== 'undefined' && document.visibilityState === 'hidden')

  const list = Array.isArray(items) ? items : []
  const slides = chunk(list, Math.max(1, Math.floor(perSlide) || 1))
  const count = slides.length
  const current = Math.min(index, Math.max(count - 1, 0))
  const auto = rotate && count > 1 && !reducedMotion
  const running = auto && !hover && !focused && onScreen && !tabHidden
  const seconds = Math.max(1, Number(intervalSeconds) || 8)

  const go = (to) => setIndex(((to % count) + count) % count)

  // the timer: one step after `seconds`; it starts again after every change (also a manual one) and whenever a pause ends
  useEffect(() => {
    if (!running) return undefined
    const timer = setTimeout(() => setIndex((value) => (Math.min(value, count - 1) + 1) % count), seconds * 1000)
    return () => clearTimeout(timer)
  }, [running, current, count, seconds])

  // at least half of the block must be on screen (a block taller than the screen counts when half of the screen shows it)
  useEffect(() => {
    const node = root.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting && (entry.intersectionRatio >= VIEW_RATIO || entry.intersectionRect.height >= window.innerHeight * VIEW_RATIO)),
      { threshold: [0, 0.25, VIEW_RATIO, 0.75, 1] },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [list.length])

  useEffect(() => {
    const sync = () => setTabHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  if (list.length === 0) return null

  const onTouchStart = (event) => {
    const point = event.touches[0]
    touch.current = point ? { x: point.clientX, y: point.clientY } : null
  }
  const onTouchEnd = (event) => {
    const start = touch.current
    const point = event.changedTouches[0]
    touch.current = null
    if (!start || !point || count < 2) return
    const dx = point.clientX - start.x
    const dy = point.clientY - start.y
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1))
  }

  return (
    <section
      ref={root}
      className="promo-block promo-scope"
      data-bs-theme={theme}
      aria-roledescription="carousel"
      aria-label={t('public.promo.carouselLabel')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="promo-block__label">{t(layout === 'LOGOS_4' ? 'public.promo.blockLabelLogos' : 'public.promo.blockLabel')}</div>
      <div className="promo-slides" aria-live={running ? 'off' : 'polite'}>
        {slides.map((slide, position) => {
          const active = position === current
          return (
            <div
              key={slide[0].id ?? position}
              className={`promo-slide promo-slide--${layout}${active ? ' is-current' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={t('public.promo.slideOf', { n: position + 1, total: count })}
              aria-hidden={active ? undefined : true}
              inert={!active}
            >
              {slide.map((promo) => (
                <SlideItem key={promo.id} promo={promo} layout={layout} active={active} preview={preview} pageView={pageView} theme={theme} />
              ))}
            </div>
          )
        })}
      </div>
      {count > 1 && (
        <div className="promo-controls">
          <button type="button" className="promo-controls__arrow" aria-label={t('public.promo.previous')} onClick={() => go(current - 1)}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <div className="promo-controls__dots">
            {slides.map((slide, position) => (
              <button key={slide[0].id ?? position} type="button" className="promo-controls__dot" aria-label={t('public.promo.slideDot', { n: position + 1, total: count })} aria-current={position === current ? 'true' : undefined} onClick={() => go(position)} />
            ))}
          </div>
          <button type="button" className="promo-controls__arrow" aria-label={t('public.promo.next')} onClick={() => go(current + 1)}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  )
}
