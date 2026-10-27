import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MEDIA_IMAGE, PLACEMENT_SIDEBAR, SIDEBAR_COUNT_MAX, SIDEBAR_COUNT_MIN, SIDEBAR_INTERVAL_MAX, SIDEBAR_INTERVAL_MIN, SIDEBAR_LAYOUTS, SIDEBAR_MAX_ITEMS } from '../../constants/promo'
import { useFormat } from '../../hooks/useFormat'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as partnerService from '../../services/partnerService'
import { mediaUrl } from '../../utils/mediaUrl'
import { PromoSlideshow } from '../promo/PromoSlideshow'

// The live preview of the sidebar settings: the slideshow really rotates with the values typed in the form (not saved yet),
// using the active sponsors that are shown in the sidebar, or placeholders when there are none; light and dark side by side.
// Nothing is counted here. `draft` holds the setting values (texts).

const clamp = (value, min, max, fallback) => {
  const number = Number.parseInt(value, 10)
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback
}

// a sponsor of the list as the page would receive it for the layout, or null when it takes no part (no sidebar image, or no logo
// in the logos layout)
function toPromo(partner, layout, label) {
  if (!partner.placements?.includes(PLACEMENT_SIDEBAR)) return null
  const sidebar = partner.creatives.find((creative) => creative.placement === PLACEMENT_SIDEBAR)
  if (!sidebar) return null
  const logos = layout === 'LOGOS_4'
  if (logos && !partner.logoUrl) return null
  return {
    id: partner.id,
    label,
    title: partner.title,
    description: partner.description,
    ctaText: partner.ctaText,
    mediaType: logos ? MEDIA_IMAGE : sidebar.mediaType,
    imageUrl: mediaUrl(logos ? partner.logoUrl : sidebar.imageUrl),
    videoUrl: !logos && sidebar.videoUrl ? mediaUrl(sidebar.videoUrl) : '',
    youtubeId: '',
    width: logos ? 256 : 300,
    height: logos ? 256 : 250,
    altText: partner.title,
  }
}

export default function SidebarPreview({ draft }) {
  const { t, i18n } = useTranslation()
  const { formatNumber } = useFormat()
  const { data } = useRemoteData('sidebar-preview-sponsors', () => partnerService.listPartners({ status: 'active', size: 100 }).catch(() => null))
  const layout = SIDEBAR_LAYOUTS.includes(draft.sponsor_sidebar_layout) ? draft.sponsor_sidebar_layout : 'LIST_1'
  const perSlide = clamp(draft.sponsor_sidebar_count, SIDEBAR_COUNT_MIN, SIDEBAR_COUNT_MAX, 1)
  const rotate = draft.sponsor_sidebar_rotate === 'true'
  const interval = clamp(draft.sponsor_sidebar_interval_seconds, SIDEBAR_INTERVAL_MIN, SIDEBAR_INTERVAL_MAX, 8)
  const label = t('dashboard.partners.preview.label')

  const real = useMemo(() => (data?.items ?? []).map((partner) => toPromo(partner, layout, label)).filter(Boolean).slice(0, SIDEBAR_MAX_ITEMS), [data, layout, label])
  // without sponsors: placeholders, enough for two or three slides
  const items = useMemo(
    () =>
      real.length > 0
        ? real
        : Array.from({ length: Math.min(SIDEBAR_MAX_ITEMS, perSlide * 2 + 1) }, (_, index) => ({
            id: -(index + 1),
            label,
            title: t('dashboard.settings.sidebarPreview.sample', { number: index + 1 }),
            description: '',
            ctaText: t('public.promo.open'),
            mediaType: MEDIA_IMAGE,
            imageUrl: '',
            videoUrl: '',
            youtubeId: '',
            width: layout === 'LOGOS_4' ? 256 : 300,
            height: layout === 'LOGOS_4' ? 256 : 250,
            altText: '',
          })),
    [real, perSlide, layout, label, t],
  )

  const slides = Math.ceil(items.length / perSlide)
  const looping = rotate && slides > 1
  let summary
  if (real.length === 0) summary = t('dashboard.settings.sidebarPreview.none')
  else if (looping) summary = t('dashboard.settings.sidebarPreview.loop', { sponsors: formatNumber(real.length), slides: formatNumber(slides), seconds: formatNumber(slides * interval) })
  else summary = t('dashboard.settings.sidebarPreview.still', { sponsors: formatNumber(real.length), slides: formatNumber(slides) })

  return (
    <div>
      <div className="row g-3">
        {['light', 'dark'].map((theme) => (
          <div key={theme} className="col-12 col-xl-6">
            <div className="promo-stage" data-bs-theme={theme} lang={i18n.language}>
              <div className="promo-stage__title">{t(`dashboard.partners.preview.${theme}`)}</div>
              <div className="promo-scope" data-bs-theme={theme}>
                <PromoSlideshow key={`${layout}|${perSlide}|${rotate}|${interval}|${items.length}`} items={items} layout={layout} perSlide={perSlide} rotate={rotate} intervalSeconds={interval} preview theme={theme} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="small text-muted mt-2 mb-0" aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
