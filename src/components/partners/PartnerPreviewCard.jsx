import { useState } from 'react'
import { Card, Nav } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { CHOICES, PLACEMENT, PLACEMENT_BAR, PLACEMENT_POPUP, PLACEMENT_SIDEBAR } from '../../constants/promo'
import { PromoBar, PromoCard, PromoPopupBody } from '../promo/PromoParts'

// How the sponsor will look in the places the admin chose (the sidebar, and the popup with the bar of a phone), in light and
// in dark mode at the same time. It draws the same components as the website, in `preview` mode: nothing is a link, nothing
// is counted and nothing is loaded from YouTube. The real media is shown: the picture, a muted looping video, or the poster of
// a YouTube video with a play icon.
//   draft: { title, description, ctaText }   places: the chosen places
//   shown: { [place]: { mediaType, imageUrl (the picture or the poster), videoUrl, youtubeId } } with complete addresses (a file
//   chosen in the page is a blob: address); MOBILE_BOTTOM_BAR is always an image: the bar image, else the popup picture or poster
export default function PartnerPreviewCard({ draft, places, shown }) {
  const { t, i18n } = useTranslation()
  const [asked, setAsked] = useState(PLACEMENT_SIDEBAR)
  const tabs = CHOICES.filter((place) => places.includes(place))
  const place = tabs.includes(asked) ? asked : tabs[0] // the tab of a place that was unchecked falls back to the first one
  const label = t('dashboard.partners.preview.label')

  const promo = (placementId) => ({
    id: 0,
    label,
    title: draft.title.trim() || t('dashboard.partners.preview.sampleTitle'),
    description: draft.description.trim(),
    ctaText: draft.ctaText.trim() || t('public.promo.open'),
    mediaType: shown[placementId]?.mediaType ?? 'IMAGE',
    imageUrl: shown[placementId]?.imageUrl ?? '',
    videoUrl: shown[placementId]?.videoUrl ?? '',
    youtubeId: shown[placementId]?.youtubeId ?? '',
    width: PLACEMENT[placementId].width,
    height: PLACEMENT[placementId].height,
    altText: '',
  })

  // one row: the same element in light and in dark mode
  const row = (title, render) => (
    <div className="mb-3">
      <div className="small fw-semibold mb-2">{title}</div>
      <div className="row g-3">
        {['light', 'dark'].map((theme) => (
          <div key={theme} className="col-12 col-xl-6">
            <div className="promo-stage" data-bs-theme={theme} lang={i18n.language}>
              <div className="promo-stage__title">{t(`dashboard.partners.preview.${theme}`)}</div>
              {render(theme)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Card>
      <Card.Header className="bg-surface">
        <h2 className="h6 mb-0">{t('dashboard.partners.preview.title')}</h2>
      </Card.Header>
      <Card.Body>
        <p className="text-muted small">{t('dashboard.partners.preview.intro')}</p>
        {tabs.length === 0 ? (
          <p className="text-muted small mb-0">{t('dashboard.partners.preview.noPlace')}</p>
        ) : (
          <>
            <Nav variant="pills" className="mb-3 flex-wrap gap-1" role="tablist" aria-label={t('dashboard.partners.preview.title')} activeKey={place} onSelect={(key) => key && setAsked(key)}>
              {tabs.map((id) => (
                <Nav.Item key={id} role="presentation">
                  <Nav.Link as="button" type="button" eventKey={id} role="tab" aria-selected={place === id}>
                    {t(`dashboard.partners.preview.tabs.${id}`)}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
            {!shown[place]?.imageUrl && !shown[place]?.videoUrl && <p className="text-muted small">{t('dashboard.partners.preview.noImage')}</p>}
            {place === PLACEMENT_SIDEBAR && row(t('dashboard.partners.preview.tabs.ARTICLE_SIDEBAR'), (theme) => <PromoCard promo={promo(PLACEMENT_SIDEBAR)} preview theme={theme} />)}
            {place === PLACEMENT_POPUP && (
              <>
                {row(t('dashboard.partners.preview.popupDesktop'), (theme) => (
                  <div className="promo-popup-frame promo-scope" data-bs-theme={theme}>
                    <PromoPopupBody promo={promo(PLACEMENT_POPUP)} preview theme={theme} />
                  </div>
                ))}
                {row(t('dashboard.partners.preview.popupMobile'), (theme) => (
                  <div className="promo-phone promo-scope" data-bs-theme={theme}>
                    <PromoBar promo={promo(PLACEMENT_BAR)} preview fixed={false} theme={theme} />
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  )
}
