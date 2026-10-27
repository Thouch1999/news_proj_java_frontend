import { X } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { PLACEMENT_POPUP, PLACEMENT_SIDEBAR } from '../../constants/promo'
import { mediaUrl } from '../../utils/mediaUrl'
import { hasVideo } from '../../utils/promo'
import { MediaFrame, Picture, PosterPlay, PromoMedia } from './PromoMedia'

// The look of a promo in its three places. These components only draw: the public page adds the click link, the counting
// and the timing (ArticlePromos.jsx); the admin preview passes `preview` and gets plain elements that go nowhere and count
// nothing. A promo: { id, title, description, ctaText, label, imageUrl, width, height, altText, clickUrl, mediaType, videoUrl,
// youtubeId } (see promoService). The media (picture, video file, YouTube) is drawn by PromoMedia.
// `.promo-scope` holds the colours (light and dark) so a preview can show both modes next to each other.
// The names say "promo" on purpose: ad blockers hide anything called ad, ads, banner or sponsor.

// The media of a card or popup that is a link as a whole (a picture; a YouTube poster has its play icon)
const Still = ({ promo }) => (promo.mediaType === 'YOUTUBE' ? <PosterPlay promo={promo} /> : <Picture promo={promo} />)

// The link of a promo: the whole element is a link to the click address of the backend (it counts the click and redirects),
// in a new tab. `rel="sponsored"` tells search engines it is paid.
function linkProps(promo, preview, onClick) {
  if (preview) return {}
  return { href: mediaUrl(promo.clickUrl), target: '_blank', rel: 'sponsored noopener noreferrer', onClick }
}

// Sidebar: a small label, the image in a 300 x 250 box, the title and the button. The whole card is the link. A card with a
// video is a block whose link is only the title and the button: the player (play, sound) is not inside a link.
// `showLabel` false leaves out the "Sponsored" pill on the media (the slideshow has one label for the whole block).
export function PromoCard({ promo, preview = false, innerRef, theme, pageView, showLabel = true }) {
  const video = !preview && hasVideo(promo, PLACEMENT_SIDEBAR)
  if (video) {
    return (
      <div ref={innerRef} className="promo-card promo-card--video promo-scope" data-bs-theme={theme}>
        <MediaFrame label={showLabel ? promo.label : null}>
          <PromoMedia promo={promo} placement={PLACEMENT_SIDEBAR} pageView={pageView} />
        </MediaFrame>
        <a className="promo-card__body promo-card__link" {...linkProps(promo, false)}>
          <span className="promo-title">{promo.title}</span>
          <span className="promo-cta">{promo.ctaText}</span>
        </a>
      </div>
    )
  }
  const Element = preview ? 'div' : 'a'
  return (
    <Element ref={innerRef} className="promo-card promo-scope" data-bs-theme={theme} {...linkProps(promo, preview)}>
      <MediaFrame label={showLabel ? promo.label : null}>{preview ? <PromoMedia promo={promo} placement={PLACEMENT_SIDEBAR} preview /> : <Still promo={promo} />}</MediaFrame>
      <span className="promo-card__body">
        <span className="promo-title">{promo.title}</span>
        <span className="promo-cta">{promo.ctaText}</span>
      </span>
    </Element>
  )
}

// A tile of the slideshow (GRID_2): the picture (6:5, edge to edge, always a still: the poster of a video) and the title on two
// lines at most. The whole tile is one link.
export function PromoTile({ promo, preview = false, innerRef }) {
  const Element = preview ? 'div' : 'a'
  return (
    <Element ref={innerRef} className="promo-tile" {...linkProps(promo, preview)}>
      <Picture promo={{ ...promo, mediaType: 'IMAGE', ratio: '6 / 5' }} />
      <span className="promo-tile__title">{promo.title}</span>
    </Element>
  )
}

// A logo of the slideshow (LOGOS_4): a square tile with the logo centered inside. The name is the tooltip and visually hidden
// text. The whole tile is one link.
export function PromoLogo({ promo, preview = false, innerRef }) {
  const Element = preview ? 'div' : 'a'
  return (
    <Element ref={innerRef} className="promo-logo" title={promo.title} {...linkProps(promo, preview)}>
      {promo.imageUrl ? <img src={mediaUrl(promo.imageUrl)} alt="" width={promo.width} height={promo.height} loading="lazy" decoding="async" /> : <span className="promo-logo__initial" aria-hidden="true">{[...(promo.title ?? '')][0] ?? ''}</span>}
      <span className="visually-hidden">{promo.title}</span>
    </Element>
  )
}

// Popup: the label, the media (600 x 400), the title, the short text and the button. The close button is the modal's. With a
// video (a file or YouTube) the link is the title, the text and the button: the video is outside it, so playing or pausing
// it is not a click on the sponsor and the button under the video is the tracked click.
export function PromoPopupBody({ promo, preview = false, innerRef, onOpen, theme, pageView }) {
  const video = !preview && hasVideo(promo, PLACEMENT_POPUP)
  if (video) {
    return (
      <div ref={innerRef} className="promo-popup-body promo-popup-body--video promo-scope" data-bs-theme={theme}>
        <MediaFrame label={promo.label}>
          <PromoMedia promo={promo} placement={PLACEMENT_POPUP} pageView={pageView} />
        </MediaFrame>
        <a className="promo-popup-body__body promo-popup-body__link" {...linkProps(promo, false, onOpen)}>
          <span className="promo-title promo-title--large">{promo.title}</span>
          {promo.description && <span className="promo-text">{promo.description}</span>}
          <span className="promo-cta">{promo.ctaText}</span>
        </a>
      </div>
    )
  }
  const Element = preview ? 'div' : 'a'
  return (
    <Element ref={innerRef} className="promo-popup-body promo-scope" data-bs-theme={theme} {...linkProps(promo, preview, onOpen)}>
      <MediaFrame label={promo.label}>{preview ? <PromoMedia promo={promo} placement={PLACEMENT_POPUP} preview /> : <Still promo={promo} />}</MediaFrame>
      <span className="promo-popup-body__body">
        <span className="promo-title promo-title--large">{promo.title}</span>
        {promo.description && <span className="promo-text">{promo.description}</span>}
        <span className="promo-cta">{promo.ctaText}</span>
      </span>
    </Element>
  )
}

// Mobile bar: the thumbnail, "Sponsored · title", an "Open" button and a close button. It is never taller than 80px
// (without the safe area at the bottom of the screen). `fixed` is false in the preview, which draws it in a frame.
export function PromoBar({ promo, preview = false, fixed = true, innerRef, onClose, theme }) {
  const { t } = useTranslation()
  return (
    <div ref={innerRef} className={`promo-bar promo-scope${fixed ? ' promo-bar--fixed' : ''}`} data-bs-theme={theme} role={preview ? undefined : 'complementary'} aria-label={preview ? undefined : t('public.promo.barLabel')}>
      {preview ? (
        <div className="promo-bar__link">
          <BarContent promo={promo} open={t('public.promo.open')} />
        </div>
      ) : (
        <a className="promo-bar__link" {...linkProps(promo, false)}>
          <BarContent promo={promo} open={t('public.promo.open')} />
        </a>
      )}
      <button type="button" className="promo-bar__close" aria-label={t('common.actions.close')} onClick={onClose} disabled={preview}>
        <X aria-hidden="true" size={22} />
      </button>
    </div>
  )
}

function BarContent({ promo, open }) {
  return (
    <>
      <span className="promo-bar__thumb" aria-hidden={promo.imageUrl ? undefined : true}>
        {promo.imageUrl ? <img src={mediaUrl(promo.imageUrl)} width={56} height={56} alt={promo.altText || ''} loading="lazy" decoding="async" /> : null}
      </span>
      <span className="promo-bar__text">
        {promo.label} &middot; {promo.title}
      </span>
      <span className="promo-cta promo-cta--small">{open}</span>
    </>
  )
}
