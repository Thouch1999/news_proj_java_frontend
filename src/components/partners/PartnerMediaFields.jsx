import { useRef } from 'react'
import { Button, ButtonGroup, Form, InputGroup, Spinner, ToggleButton } from 'react-bootstrap'
import { ArrowCounterclockwise, CheckCircle, PlayFill, Trash, Upload } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { MEDIA_BY_PLACEMENT, MEDIA_ICON, MEDIA_VIDEO, MEDIA_YOUTUBE, PLACEMENT } from '../../constants/promo'
import { youtubeThumbnail } from '../../hooks/usePartnerMedia'
import { mediaUrl } from '../../utils/mediaUrl'

// The media of a place that is a video: the segmented control "Media type", the video file with its poster, and the YouTube
// link. The state comes from usePartnerMedia (a chosen file is only kept in the page and uploaded when the sponsor is saved).
//   saved: the stored creative of the place (or undefined); state: media[place]; limits: from the backend options.

// "Media type": only the types the place accepts (the sidebar has no YouTube)
export function MediaTypeSwitch({ place, value, disabled, onChange }) {
  const { t } = useTranslation()
  return (
    <div className="mb-3">
      <div className="fw-semibold small mb-1" id={`partner-media-type-${place}-label`}>
        {t('dashboard.partners.media.type')}
      </div>
      <ButtonGroup role="radiogroup" aria-labelledby={`partner-media-type-${place}-label`} className="partner-media-switch flex-wrap">
        {MEDIA_BY_PLACEMENT[place].map((type) => {
          const Icon = MEDIA_ICON[type]
          return (
            <ToggleButton key={type} id={`partner-media-${place}-${type}`} type="radio" variant="outline-primary" size="sm" name={`partner-media-${place}`} value={type} checked={value === type} disabled={disabled} onChange={() => onChange(type)}>
              <Icon className="me-1" aria-hidden="true" />
              {t(`dashboard.partners.media.types.${type}`)}
            </ToggleButton>
          )
        })}
      </ButtonGroup>
    </div>
  )
}

// The poster of a video: required for a video file, optional for YouTube (the thumbnail of the video is used without it).
function PosterPicker({ place, saved, state, required, disabled, error, onChoose, onClear, onThumbnail }) {
  const { t } = useTranslation()
  const input = useRef(null)
  const placement = PLACEMENT[place]
  const sameKind = saved?.mediaType === state.type
  const thumbnail = state.type === MEDIA_YOUTUBE && state.check ? youtubeThumbnail(state.check.videoId) : ''
  // the poster shown: the chosen one, else the stored one, else (YouTube) the thumbnail of the checked video
  const stored = sameKind && !state.resetPoster ? mediaUrl(saved.imageUrl) : ''
  const src = state.poster.file ? state.poster.preview : stored || thumbnail
  const custom = Boolean(state.poster.file) || (stored && saved.imageUrl.startsWith('/uploads/'))
  const id = `partner-poster-${place}`

  return (
    <div className="mt-3">
      <div className="fw-semibold">
        {t('dashboard.partners.media.poster.title')}
        {required ? (
          <span className="text-danger ms-1" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="text-muted fw-normal ms-1 small">{t('dashboard.partners.media.poster.optional')}</span>
        )}
      </div>
      <p className="text-muted small mb-2">
        {t('dashboard.partners.media.poster.help', { width: placement.width, height: placement.height })} {!required && t('dashboard.partners.media.poster.helpYoutube')}
      </p>
      <div className={`partner-image-box mb-2${error ? ' is-invalid' : ''}`} style={{ width: placement.width, maxWidth: '100%', aspectRatio: `${placement.width} / ${placement.height}` }}>
        {src ? <img src={src} alt="" /> : <span className="small p-2 text-center">{t('dashboard.partners.media.poster.none')}</span>}
      </div>
      <input
        ref={input}
        id={id}
        type="file"
        className="d-none"
        accept="image/png,image/jpeg,image/webp"
        aria-label={t('dashboard.partners.media.poster.title')}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onChoose(file)
        }}
      />
      <div className="d-flex flex-wrap gap-2">
        <Button id={`partner-poster-upload-${place}`} variant="outline-primary" size="sm" disabled={disabled} onClick={() => input.current?.click()}>
          <Upload className="me-1" aria-hidden="true" />
          {custom ? t('dashboard.partners.media.poster.replace') : t('dashboard.partners.media.poster.upload')}
        </Button>
        {state.poster.file && (
          <Button variant="link" size="sm" disabled={disabled} onClick={onClear}>
            <ArrowCounterclockwise className="me-1" aria-hidden="true" />
            {t('common.actions.clear')}
          </Button>
        )}
        {/* YouTube only: a stored custom poster can go back to the thumbnail of the video */}
        {onThumbnail && custom && !state.poster.file && (
          <Button variant="outline-secondary" size="sm" disabled={disabled} onClick={onThumbnail}>
            <Trash className="me-1" aria-hidden="true" />
            {t('dashboard.partners.media.poster.useThumbnail')}
          </Button>
        )}
      </div>
      {state.resetPoster && <div className="text-muted small mt-2">{t('dashboard.partners.media.poster.thumbnailNote')}</div>}
      {state.poster.file && <div className="text-muted small mt-2">{t('dashboard.partners.media.pending')}</div>}
      {state.poster.problem && (
        <div className="text-danger small mt-2" role="alert">
          {state.poster.problem}
        </div>
      )}
    </div>
  )
}

// A video file: the file, a preview that plays muted in a loop with controls, and the poster (required).
export function VideoSlot({ place, saved, state, limits, error, disabled, onChooseVideo, onClearVideo, onChoosePoster, onClearPoster }) {
  const { t } = useTranslation()
  const input = useRef(null)
  const placement = PLACEMENT[place]
  const storedVideo = saved?.mediaType === MEDIA_VIDEO ? mediaUrl(saved.videoUrl) : ''
  const storedPoster = saved?.mediaType === MEDIA_VIDEO ? mediaUrl(saved.imageUrl) : ''
  const src = state.video.file ? state.video.preview : storedVideo
  const poster = state.poster.file ? state.poster.preview : storedPoster
  const id = `partner-video-${place}`

  return (
    <div>
      <div className="fw-semibold">
        {t('dashboard.partners.media.video.title')}
        <span className="text-danger ms-1" aria-hidden="true">
          *
        </span>
      </div>
      <p className="text-muted small mb-2">{t('dashboard.partners.media.video.help', { maxMb: Math.round(limits.videoMaxBytes / (1024 * 1024)), maxSeconds: limits.videoMaxSeconds })}</p>
      <div className={`partner-image-box partner-video-box mb-2${error ? ' is-invalid' : ''}`} style={{ width: placement.width, maxWidth: '100%', aspectRatio: `${placement.width} / ${placement.height}` }}>
        {src ? (
          <video key={src} src={src} poster={poster || undefined} muted loop playsInline controls preload="metadata" aria-label={t('dashboard.partners.media.video.preview')} />
        ) : (
          <span className="small p-2 text-center">{t('dashboard.partners.media.video.none')}</span>
        )}
      </div>
      <input
        ref={input}
        id={id}
        type="file"
        className="d-none"
        accept="video/mp4,video/webm"
        aria-label={t('dashboard.partners.media.video.title')}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onChooseVideo(file)
        }}
      />
      <div className="d-flex flex-wrap gap-2">
        <Button id={`partner-upload-video-${place}`} variant="outline-primary" size="sm" disabled={disabled} aria-describedby={error ? `${id}-error` : undefined} onClick={() => input.current?.click()}>
          <Upload className="me-1" aria-hidden="true" />
          {state.video.file || storedVideo ? t('dashboard.partners.media.video.replace') : t('dashboard.partners.media.video.upload')}
        </Button>
        {state.video.file && (
          <Button variant="link" size="sm" disabled={disabled} onClick={onClearVideo}>
            <ArrowCounterclockwise className="me-1" aria-hidden="true" />
            {storedVideo ? t('dashboard.partners.media.video.undo') : t('common.actions.clear')}
          </Button>
        )}
      </div>
      {state.video.file && !state.video.problem && (
        <div className="text-muted small mt-2">
          {t('dashboard.partners.media.pending')}
          {state.video.seconds !== null && ` ${t('dashboard.partners.media.video.seconds', { seconds: Math.round(state.video.seconds) })}`}
        </div>
      )}
      {state.video.file && <div className="text-muted small">{t('dashboard.partners.media.video.newNeedsPoster')}</div>}
      {(state.video.problem || error) && (
        <div id={`${id}-error`} className="text-danger small mt-2" role="alert">
          {state.video.problem || error}
        </div>
      )}
      <PosterPicker place={place} saved={saved} state={state} required disabled={disabled} onChoose={onChoosePoster} onClear={onClearPoster} error={error} />
    </div>
  )
}

// A YouTube video: the link, "Check" (the backend validates it and gives the thumbnail) and an optional custom poster.
// `title` is the title typed in the sponsor form: it is shown under the thumbnail as readers will see it.
export function YoutubeSlot({ place, saved, state, error, title, disabled, onUrl, onCheck, onChoosePoster, onClearPoster, onThumbnail }) {
  const { t } = useTranslation()
  const id = `partner-youtube-${place}`
  const problem = state.problem || error
  const posterSrc = state.poster.file ? state.poster.preview : ''

  return (
    <div>
      <div className="fw-semibold">
        {t('dashboard.partners.media.youtube.title')}
        <span className="text-danger ms-1" aria-hidden="true">
          *
        </span>
      </div>
      <Form.Group controlId={id} className="mt-1">
        <Form.Label className="small mb-1">{t('dashboard.partners.media.youtube.link')}</Form.Label>
        <InputGroup hasValidation>
          <Form.Control
            type="url"
            inputMode="url"
            value={state.url}
            disabled={disabled}
            isInvalid={Boolean(problem)}
            placeholder={t('dashboard.partners.media.youtube.placeholder')}
            aria-describedby={`${id}-help`}
            onChange={(event) => onUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault() // Enter checks the link, it does not save the whole sponsor
                onCheck()
              }
            }}
          />
          <Button id={`partner-youtube-check-${place}`} variant="outline-primary" disabled={disabled || state.checking} onClick={onCheck}>
            {state.checking ? <Spinner size="sm" animation="border" className="me-1" /> : <CheckCircle className="me-1" aria-hidden="true" />}
            {state.checking ? t('dashboard.partners.media.youtube.checking') : t('dashboard.partners.media.youtube.check')}
          </Button>
          <Form.Control.Feedback type="invalid">{problem}</Form.Control.Feedback>
        </InputGroup>
        <Form.Text id={`${id}-help`} className="text-muted">
          {t('dashboard.partners.media.youtube.help')}
        </Form.Text>
      </Form.Group>

      {state.check && (
        <div className="partner-youtube-found mt-3" aria-live="polite">
          <div className="small text-success fw-semibold mb-2">
            <CheckCircle className="me-1" aria-hidden="true" />
            {t('dashboard.partners.media.youtube.found')} <span className="text-muted fw-normal">{t('dashboard.partners.media.youtube.videoId', { id: state.check.videoId })}</span>
          </div>
          <div className="partner-youtube-card">
            <span className="partner-youtube-card__poster">
              <img src={posterSrc || state.check.thumbnailUrl} alt="" />
              <span className="promo-media__play promo-media__play--static" aria-hidden="true">
                <PlayFill size={36} />
              </span>
            </span>
            <span className="partner-youtube-card__title">{title.trim() || t('dashboard.partners.preview.sampleTitle')}</span>
          </div>
        </div>
      )}
      {!state.check && state.url.trim() && !state.problem && <div className="text-muted small mt-2">{t('dashboard.partners.media.youtube.changed')}</div>}

      <PosterPicker place={place} saved={saved} state={state} disabled={disabled} onChoose={onChoosePoster} onClear={onClearPoster} onThumbnail={onThumbnail} />
    </div>
  )
}
