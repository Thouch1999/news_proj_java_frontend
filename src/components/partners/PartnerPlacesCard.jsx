import { useRef } from 'react'
import { Button, Card, Form } from 'react-bootstrap'
import { ArrowCounterclockwise, Trash, Upload } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { MEDIA_IMAGE, MEDIA_VIDEO, MEDIA_YOUTUBE, PARTNER_MAX, PLACEMENT, PLACEMENT_BAR, PLACEMENT_POPUP, PLACEMENT_SIDEBAR } from '../../constants/promo'
import { mediaUrl } from '../../utils/mediaUrl'
import { imageSizeWarning } from '../../utils/partnerValidation'
import { MediaTypeSwitch, VideoSlot, YoutubeSlot } from './PartnerMediaFields'
import PartnerTimingFields from './PartnerTimingFields'

// "Where to show": the two places an admin chooses (the right sidebar and the popup, which is also the small bar at the
// bottom of a phone). Under a checked place its media is chosen: "Media type" (an image, a video file or, in the popup, a
// YouTube link), then the image, the video with its poster or the link, shown at the real display size; the popup also has the
// optional bar image (always a picture) and its "Popup timing". An unchecked place hides its upload area but keeps its media
// ("Image kept"): checking it again needs no new upload. A chosen file is only kept in the page and uploaded when the sponsor
// is saved.
//   images[place] = { file, preview, remove, alt, natural, problem }   saved = the creatives of the saved sponsor
//   media = what usePartnerMedia returns (the video and YouTube choices)   limits / options: from the backend
//   form / onFormChange: the popup timing fields of the form   title: the sponsor title typed so far
//   errors: { placements, sidebarImage, popupImage, popupTrigger, ... } (the page checks and the backend)
const OPTIONS = [
  { place: PLACEMENT_SIDEBAR, key: 'sidebar', errorKey: 'sidebarImage' },
  { place: PLACEMENT_POPUP, key: 'popup', errorKey: 'popupImage' },
]

export default function PartnerPlacesCard({ places, saved, images, errors, disabled, onToggle, onChoose, onUndo, onAlt, media, options, form, onFormChange, title }) {
  const { t } = useTranslation()
  const creativeOf = (place) => saved.find((item) => item.placement === place)

  return (
    <Card className="editor-field" id="partner-places" tabIndex={-1}>
      <Card.Header className="bg-surface">
        <h2 className="h6 mb-0" id="partner-places-title">
          {t('dashboard.partners.where.title')}
        </h2>
      </Card.Header>
      <Card.Body>
        <p className="text-muted small">{t('dashboard.partners.where.intro')}</p>
        <div role="group" aria-labelledby="partner-places-title" aria-describedby={errors.placements ? 'partner-places-error' : undefined} className="d-flex flex-column gap-3">
          {OPTIONS.map((option) => {
            const checked = places.includes(option.place)
            const stored = creativeOf(option.place)
            const hasImage = Boolean(images[option.place].file) || Boolean(stored)
            return (
              <div key={option.place} className={`partner-place${checked ? ' is-checked' : ''}${errors[option.errorKey] ? ' has-error' : ''}`}>
                <label className="partner-place__row" htmlFor={`partner-place-${option.place}`}>
                  <input id={`partner-place-${option.place}`} type="checkbox" className="form-check-input" checked={checked} disabled={disabled} onChange={() => onToggle(option.place)} />
                  <span>
                    <span className="fw-semibold d-block">{t(`dashboard.partners.where.${option.key}.label`)}</span>
                    <span className="small text-muted">{t(`dashboard.partners.where.${option.key}.help`)}</span>
                  </span>
                </label>
                {checked && (
                  <div className="partner-place__body">
                    <MediaTypeSwitch place={option.place} value={media.media[option.place].type} disabled={disabled} onChange={(type) => media.setType(option.place, type)} />
                    {media.media[option.place].type === MEDIA_IMAGE && (
                      <ImageSlot
                        placement={PLACEMENT[option.place]}
                        title={t(`dashboard.partners.images.${option.key}`)}
                        creative={stored?.mediaType === MEDIA_IMAGE ? stored : undefined} // the poster of a video is not "the image"
                        image={images[option.place]}
                        error={errors[option.errorKey]}
                        disabled={disabled}
                        onChoose={(file) => onChoose(option.place, file)}
                        onUndo={() => onUndo(option.place)}
                        onAlt={(value) => onAlt(option.place, value)}
                      />
                    )}
                    {media.media[option.place].type === MEDIA_VIDEO && (
                      <VideoSlot
                        place={option.place}
                        saved={stored}
                        state={media.media[option.place]}
                        limits={options.limits}
                        error={errors[option.errorKey]}
                        disabled={disabled}
                        onChooseVideo={(file) => media.chooseVideo(option.place, file)}
                        onClearVideo={() => media.clearVideo(option.place)}
                        onChoosePoster={(file) => media.choosePoster(option.place, file)}
                        onClearPoster={() => media.clearPoster(option.place)}
                      />
                    )}
                    {media.media[option.place].type === MEDIA_YOUTUBE && (
                      <YoutubeSlot
                        place={option.place}
                        saved={stored}
                        state={media.media[option.place]}
                        error={errors[option.errorKey]}
                        title={title}
                        disabled={disabled}
                        onUrl={(url) => media.setUrl(option.place, url)}
                        onCheck={() => media.checkUrl(option.place, media.media[option.place].url)}
                        onChoosePoster={(file) => media.choosePoster(option.place, file)}
                        onClearPoster={() => media.clearPoster(option.place)}
                        onThumbnail={() => media.useThumbnail(option.place)}
                      />
                    )}
                    {option.place === PLACEMENT_POPUP && <p className="text-muted small mt-3 mb-0">{t('dashboard.partners.media.mobileNote')}</p>}
                    {option.place === PLACEMENT_POPUP && <PartnerTimingFields form={form} errors={errors} options={options} disabled={disabled} onChange={onFormChange} />}
                  </div>
                )}
                {!checked && hasImage && <div className="partner-place__kept small text-muted">{t('dashboard.partners.images.kept')}</div>}
              </div>
            )
          })}
        </div>
        {errors.placements && (
          <div id="partner-places-error" className="text-danger small mt-2" role="alert">
            {errors.placements}
          </div>
        )}
      </Card.Body>
    </Card>
  )
}

// "Logo": the square logo (256 x 256 px) of the sponsor. The bottom bar of a phone and the sidebar layout "Logos" use it; without
// it a phone shows a square part of the popup image and the Logos layout skips the sponsor. `required` (the Logos layout is on
// and the sidebar is chosen) only adds the star and the check of the form. The logo is saved with its own call.
export function LogoCard({ saved, image, required, error, disabled, onChoose, onRemove, onUndo, onAlt }) {
  const { t } = useTranslation()
  return (
    <Card className="editor-field" id="partner-logo">
      <Card.Header className="bg-surface">
        <h2 className="h6 mb-0">{t('dashboard.partners.logo.title')}</h2>
      </Card.Header>
      <Card.Body>
        <p className="text-muted small">{t('dashboard.partners.logo.intro')}</p>
        <ImageSlot
          placement={PLACEMENT[PLACEMENT_BAR]}
          title={t('dashboard.partners.images.logo')}
          creative={saved.find((item) => item.placement === PLACEMENT_BAR)}
          image={image}
          error={error}
          optional
          star={required}
          disabled={disabled}
          onChoose={onChoose}
          onRemove={onRemove}
          onUndo={onUndo}
          onAlt={onAlt}
        />
      </Card.Body>
    </Card>
  )
}

// One image: the picture at its real size, the size to upload, "Upload / Replace" and, for the optional bar image only,
// "Remove". `optional` is the bar image: without it the server cuts a square out of the popup image.
function ImageSlot({ placement, title, creative, image, error, optional = false, star = !optional, disabled, onChoose, onRemove, onUndo, onAlt }) {
  const { t } = useTranslation()
  const input = useRef(null)
  const generated = Boolean(creative?.generated)
  const src = image.file ? image.preview : !image.remove && creative ? mediaUrl(creative.imageUrl) : ''
  const own = Boolean(creative) && !generated && !image.remove // an image the admin uploaded (not the crop made by the server)
  const same = placement.width === placement.uploadWidth
  const warning = image.file ? imageSizeWarning(placement.id, image.natural) : ''
  const id = `partner-image-${placement.id}`

  return (
    <div>
      <div className="fw-semibold">
        {title}
        {star && <span className="text-danger ms-1" aria-hidden="true">*</span>}
      </div>
      <p className="text-muted small mb-2">
        {same
          ? t('dashboard.partners.images.recommendedSame', { width: placement.width, height: placement.height })
          : t('dashboard.partners.images.recommended', { width: placement.width, height: placement.height, uploadWidth: placement.uploadWidth, uploadHeight: placement.uploadHeight })}
      </p>
      <div className={`partner-image-box mb-2${error ? ' is-invalid' : ''}`} style={{ width: placement.width, aspectRatio: `${placement.width} / ${placement.height}` }}>
        {src ? (
          <img src={src} alt={image.file ? image.alt || '' : (creative?.altText ?? '')} />
        ) : (
          <span className="small p-2 text-center">{optional ? t('dashboard.partners.images.logoHint') : t('dashboard.partners.images.none')}</span>
        )}
      </div>
      <input
        ref={input}
        id={id}
        type="file"
        className="d-none"
        accept="image/png,image/jpeg,image/webp"
        aria-label={title}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = '' // the same file can be chosen again
          if (file) onChoose(file)
        }}
      />
      <div className="d-flex flex-wrap gap-2">
        <Button id={`partner-upload-${placement.id}`} variant="outline-primary" size="sm" disabled={disabled} aria-describedby={error ? `${id}-error` : undefined} onClick={() => input.current?.click()}>
          <Upload className="me-1" aria-hidden="true" />
          {image.file || own || (!optional && creative) ? t('dashboard.partners.images.replace') : t('dashboard.partners.images.upload')}
        </Button>
        {/* only the optional bar image can be removed: the image of a chosen place is replaced, never removed */}
        {optional && (image.file || own) && (
          <Button variant="outline-secondary" size="sm" disabled={disabled} onClick={onRemove}>
            <Trash className="me-1" aria-hidden="true" />
            {t('dashboard.partners.images.remove')}
          </Button>
        )}
        {(image.file || image.remove) && creative && (
          <Button variant="link" size="sm" disabled={disabled} onClick={onUndo}>
            <ArrowCounterclockwise className="me-1" aria-hidden="true" />
            {t('dashboard.partners.images.undo')}
          </Button>
        )}
        {image.file && !creative && (
          <Button variant="link" size="sm" disabled={disabled} onClick={onUndo}>
            <ArrowCounterclockwise className="me-1" aria-hidden="true" />
            {t('common.actions.clear')}
          </Button>
        )}
      </div>
      {optional && generated && !image.file && !image.remove && <div className="text-muted small mt-2">{t('dashboard.partners.images.barGenerated')}</div>}
      {optional && image.remove && <div className="text-muted small mt-2">{t('dashboard.partners.images.removing')}</div>}
      {(image.problem || error) && (
        <div id={`${id}-error`} className="text-danger small mt-2" role="alert">
          {image.problem || error}
        </div>
      )}
      {warning && <div className="text-warning-emphasis small mt-2">{warning}</div>}
      {image.file && !image.problem && <div className="text-muted small mt-2">{t('dashboard.partners.images.pending')}</div>}
      {image.file && !image.problem && (
        <Form.Group className="mt-2" controlId={`${id}-alt`}>
          <Form.Label className="small mb-1">{t('dashboard.partners.images.alt')}</Form.Label>
          <Form.Control size="sm" value={image.alt} maxLength={PARTNER_MAX.title} onChange={(event) => onAlt(event.target.value)} aria-describedby={`${id}-alt-help`} />
          <Form.Text id={`${id}-alt-help`} className="text-muted">
            {t('dashboard.partners.images.altHelp')}
          </Form.Text>
        </Form.Group>
      )}
    </div>
  )
}
