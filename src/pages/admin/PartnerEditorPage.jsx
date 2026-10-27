import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Form, InputGroup, Spinner, Toast, ToastContainer } from 'react-bootstrap'
import { BarChart, BoxArrowUpRight } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import FormField from '../../components/form/FormField'
import PartnerPlacesCard, { LogoCard } from '../../components/partners/PartnerPlacesCard'
import PartnerPreviewCard from '../../components/partners/PartnerPreviewCard'
import { CategoriesCard, PublishingCard } from '../../components/partners/PartnerSideCards'
import { CHOICES, MEDIA_IMAGE, MEDIA_VIDEO, MEDIA_YOUTUBE, OPTIONS_FALLBACK, PARTNER_MAX, PLACEMENT_BAR, PLACEMENT_IDS, PLACEMENT_POPUP, PLACEMENT_SIDEBAR, WEIGHT_DEFAULT, youtubeLink } from '../../constants/promo'
import { adminPartnerPath, adminPartnerStatsPath, ROUTES } from '../../constants/routes'
import { usePageMeta } from '../../hooks/usePageMeta'
import { usePartnerMedia, youtubeThumbnail } from '../../hooks/usePartnerMedia'
import { useRemoteData } from '../../hooks/useRemoteData'
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning'
import * as categoryService from '../../services/categoryService'
import * as partnerService from '../../services/partnerService'
import { errorMessage } from '../../utils/errorMessage'
import { mediaUrl } from '../../utils/mediaUrl'
import { isHttpsUrl, validatePartner, validatePartnerImage, validatePartnerMedia } from '../../utils/partnerValidation'
import { toLocalInput, toUtc } from '../../utils/promo'

// the fields the backend can report an error for, in the order of the page (the page scrolls to the first one)
const FIELD_ORDER = ['name', 'title', 'description', 'ctaText', 'targetUrl', 'placements', 'sidebarImage', 'popupImage', 'logo', 'popupTrigger', 'popupDelaySeconds', 'popupScrollPercent', 'popupFrequency', 'popupFrequencyDays', 'weight', 'endAt', 'categoryIds']
const FIELD_ID = {
  name: 'partner-name',
  title: 'partner-title',
  description: 'partner-description',
  ctaText: 'partner-cta',
  targetUrl: 'partner-url',
  placements: 'partner-places',
  logo: 'partner-upload-MOBILE_BOTTOM_BAR',
  sidebarImage: 'partner-upload-ARTICLE_SIDEBAR',
  popupImage: 'partner-upload-ARTICLE_POPUP',
  popupTrigger: 'partner-popup-trigger',
  popupDelaySeconds: 'partner-popup-delay',
  popupScrollPercent: 'partner-popup-scroll',
  popupFrequency: 'partner-popup-frequency',
  popupFrequencyDays: 'partner-popup-days',
  weight: 'partner-weight',
  endAt: 'partner-end',
  categoryIds: 'partner-categories',
}
// the field of a place that shows the problem of its media (a missing or refused image, video file, poster or link)
const PLACE_ERROR = { [PLACEMENT_SIDEBAR]: 'sidebarImage', [PLACEMENT_POPUP]: 'popupImage', [PLACEMENT_BAR]: 'logo' }

// The square logo is saved with the sponsor (logoUrl), not as a creative. The form treats it as the image of the bar slot: a
// logo replaces the bar creatives of the list (the generated crop is only the fallback, shown when there is no logo).
function withLogo(partner) {
  if (!partner) return partner
  const rest = partner.logoUrl ? partner.creatives.filter((creative) => creative.placement !== PLACEMENT_BAR) : partner.creatives
  const logo = partner.logoUrl ? [{ placement: PLACEMENT_BAR, imageUrl: partner.logoUrl, altText: '', generated: false, mediaType: MEDIA_IMAGE, width: 128, height: 128 }] : []
  return { ...partner, creatives: [...rest, ...logo] }
}

// `defaults` are the current site defaults of the popup (the form shows them while the sponsor uses them)
function toForm(partner, defaults) {
  return {
    name: partner?.name ?? '',
    title: partner?.title ?? '',
    description: partner?.description ?? '',
    ctaText: partner?.ctaText ?? '',
    targetUrl: partner?.targetUrl ?? '',
    active: partner?.active ?? false,
    startAt: toLocalInput(partner?.startAt),
    endAt: toLocalInput(partner?.endAt),
    weight: partner?.weight ?? WEIGHT_DEFAULT,
    language: partner?.language ?? 'ALL',
    placements: partner?.placements ?? [PLACEMENT_SIDEBAR], // a new sponsor starts with the sidebar
    categoryIds: partner?.categoryIds ?? [],
    popupUseDefaults: partner?.popupUseDefaults ?? true,
    popupTrigger: partner?.popupTrigger ?? defaults.trigger,
    popupDelaySeconds: partner?.popupDelaySeconds ?? defaults.delaySeconds,
    popupScrollPercent: partner?.popupScrollPercent ?? defaults.scrollPercent,
    popupFrequency: partner?.popupFrequency ?? defaults.frequency,
    popupFrequencyDays: partner?.popupFrequencyDays ?? defaults.frequencyDays,
  }
}

// a number of the form for the backend: empty is null
const numberOrNull = (value) => (value === '' || value === null || value === undefined ? null : Number(value))

const emptyImage = { file: null, preview: '', remove: false, alt: '', natural: null, problem: '' }
const freshImages = () => Object.fromEntries(PLACEMENT_IDS.map((id) => [id, { ...emptyImage }]))

function PartnerForm({ initial, categories, options }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state: locationState } = useLocation()
  const [partner, setPartner] = useState(initial) // null while a new sponsor is typed
  const [form, setForm] = useState(() => toForm(initial, options.popupDefaults))
  const [saved, setSaved] = useState(() => JSON.stringify(toForm(initial, options.popupDefaults)))
  const [images, setImages] = useState(freshImages) // the pictures chosen in this page and not saved yet
  const media = usePartnerMedia(partner, options.limits) // the video files and YouTube links chosen in this page
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(() => (locationState?.message ? { variant: locationState.error ? 'danger' : 'success', text: locationState.message } : null))
  const [focusField, setFocusField] = useState(null)
  const previews = useRef(new Set()) // the object addresses of the chosen files: freed when they are replaced and on leaving

  const savedOf = (id) => partner?.creatives.find((item) => item.placement === id)
  const pending = PLACEMENT_IDS.some((id) => images[id].file || images[id].remove) || CHOICES.some((id) => media.pending(id, savedOf(id)))
  const dirty = JSON.stringify(form) !== saved || pending
  const { blocker, markClean } = useUnsavedChangesWarning(dirty)
  usePageMeta(partner ? t('dashboard.partners.form.titleEdit') : t('dashboard.partners.form.titleNew'))

  useEffect(() => {
    const urls = previews.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const change = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }
  const text = (field) => (event) => change(field, event.target.value)
  // checking or unchecking a place: its image stays stored (and chosen in the page) either way
  const togglePlace = (place) => {
    change('placements', CHOICES.filter((id) => (id === place ? !form.placements.includes(id) : form.placements.includes(id))))
    setErrors((current) => ({ ...current, placements: '', sidebarImage: '', popupImage: '' }))
  }

  // ---- the pictures ----
  const patchImage = (id, patch) => setImages((current) => ({ ...current, [id]: { ...current[id], ...patch } }))
  const release = (id) => {
    const url = images[id].preview
    if (url) {
      URL.revokeObjectURL(url)
      previews.current.delete(url)
    }
  }
  const chooseImage = (id, file) => {
    const problem = validatePartnerImage(file)
    release(id)
    if (problem) {
      patchImage(id, { ...emptyImage, remove: images[id].remove, problem })
      return
    }
    const preview = URL.createObjectURL(file)
    previews.current.add(preview)
    patchImage(id, { file, preview, remove: false, alt: '', natural: null, problem: '' })
    const probe = new window.Image()
    probe.onload = () => patchImage(id, { natural: { width: probe.naturalWidth, height: probe.naturalHeight } })
    probe.src = preview
  }
  const removeImage = (id) => {
    release(id)
    patchImage(id, { ...emptyImage, remove: Boolean(partner?.creatives.some((creative) => creative.placement === id)) })
  }
  const undoImage = (id) => {
    release(id)
    patchImage(id, { ...emptyImage })
  }
  // the address of the image shown for a place: the picture chosen in the page, else the saved one (the poster of a saved
  // video is not "the image")
  const shownOf = (id) => (images[id].file ? images[id].preview : !images[id].remove && savedOf(id)?.mediaType === MEDIA_IMAGE ? mediaUrl(savedOf(id).imageUrl) : '')
  // what the preview draws for a place: the media chosen in the page, else the saved one
  const shownMedia = (id) => {
    const state = media.media[id]
    const stored = savedOf(id)
    if (state.type === MEDIA_VIDEO) {
      const same = stored?.mediaType === MEDIA_VIDEO
      return {
        mediaType: MEDIA_VIDEO,
        imageUrl: state.poster.file ? state.poster.preview : same ? mediaUrl(stored.imageUrl) : '',
        videoUrl: state.video.file ? state.video.preview : same ? mediaUrl(stored.videoUrl) : '',
      }
    }
    if (state.type === MEDIA_YOUTUBE) {
      const same = stored?.mediaType === MEDIA_YOUTUBE
      const videoId = state.check?.videoId ?? (same ? stored.youtubeId : '')
      const custom = state.poster.file ? state.poster.preview : same && !state.resetPoster && stored.imageUrl.startsWith('/uploads/') ? mediaUrl(stored.imageUrl) : ''
      return { mediaType: MEDIA_YOUTUBE, youtubeId: videoId, imageUrl: custom || (videoId ? youtubeThumbnail(videoId) : '') }
    }
    return { mediaType: MEDIA_IMAGE, imageUrl: shownOf(id) }
  }
  // the bar: its own image (a chosen one or an uploaded one), else the popup image (the page shows a square center of it)
  const ownBar = images[PLACEMENT_BAR].file ? images[PLACEMENT_BAR].preview : !images[PLACEMENT_BAR].remove && savedOf(PLACEMENT_BAR) && !savedOf(PLACEMENT_BAR).generated ? mediaUrl(savedOf(PLACEMENT_BAR).imageUrl) : ''
  const popupMedia = shownMedia(PLACEMENT_POPUP)
  // the bar of a phone is always a picture: its own, else the picture (or the poster) of the popup
  const shown = {
    [PLACEMENT_SIDEBAR]: shownMedia(PLACEMENT_SIDEBAR),
    [PLACEMENT_POPUP]: popupMedia,
    [PLACEMENT_BAR]: { mediaType: MEDIA_IMAGE, imageUrl: ownBar || popupMedia.imageUrl },
  }
  // the sidebar layout "Logos" shows only sponsors with a logo: the form asks for it when the sidebar is chosen
  const savedLogo = savedOf(PLACEMENT_BAR) && !savedOf(PLACEMENT_BAR).generated
  const hasLogo = Boolean(images[PLACEMENT_BAR].file) || (savedLogo && !images[PLACEMENT_BAR].remove)
  const logoRequired = options.sidebar?.layout === 'LOGOS_4' && form.placements.includes(PLACEMENT_SIDEBAR)

  // what a chosen place still needs, for the checks before saving
  const mediaState = (id) => ({
    type: media.media[id].type,
    saved: savedOf(id),
    imageFile: images[id].file,
    videoFile: media.media[id].video.file,
    posterFile: media.media[id].poster.file,
    youtubeUrl: media.media[id].url,
  })

  // the media of a place that was chosen in the page goes to the backend: an image, a video file with its poster, or a YouTube link
  const uploadMedia = async (current, place) => {
    const state = media.media[place]
    if (state.type === MEDIA_IMAGE) {
      return images[place].file ? partnerService.uploadPartnerImage(current.id, place, images[place].file, images[place].alt.trim()) : current
    }
    const stored = current.creatives.find((creative) => creative.placement === place)
    if (state.type === MEDIA_VIDEO) {
      if (state.video.file) return partnerService.uploadPartnerVideo(current.id, place, state.video.file, state.poster.file)
      if (state.poster.file && stored?.mediaType === MEDIA_VIDEO) return partnerService.uploadPartnerPoster(current.id, place, state.poster.file)
      return current
    }
    const link = state.url.trim()
    const same = stored?.mediaType === MEDIA_YOUTUBE && link === youtubeLink(stored.youtubeId)
    if (same && state.poster.file) return partnerService.uploadPartnerPoster(current.id, place, state.poster.file)
    if (same && !state.resetPoster) return current
    // a new link, or back to the thumbnail of the video (no poster file)
    return partnerService.uploadPartnerYoutube(current.id, place, link, state.resetPoster ? null : state.poster.file)
  }

  // ---- saving ----
  const revealFirst = (found) => {
    const name = FIELD_ORDER.find((field) => found[field])
    if (name) setFocusField({ name, nonce: Date.now() })
  }
  useEffect(() => {
    if (!focusField) return
    const element = document.getElementById(FIELD_ID[focusField.name])
    if (!element) return
    element.scrollIntoView({ block: 'center', behavior: 'smooth' })
    element.focus?.({ preventScroll: true })
  }, [focusField])

  const save = async (event) => {
    event?.preventDefault()
    if (busy) return
    const found = { ...validatePartner(form, options.limits), ...validatePartnerMedia(form.placements, mediaState) }
    if (logoRequired && !hasLogo) found.logo = t('dashboard.partners.errors.logo')
    setErrors(found)
    setApiError(null)
    if (Object.keys(found).length > 0) {
      revealFirst(found)
      return
    }
    setBusy(true)
    const payload = {
      name: form.name.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      ctaText: form.ctaText.trim(),
      targetUrl: form.targetUrl.trim(),
      startAt: toUtc(form.startAt),
      endAt: toUtc(form.endAt),
      weight: Number(form.weight),
      language: form.language,
      placements: form.placements,
      categoryIds: form.categoryIds,
      popupUseDefaults: form.popupUseDefaults,
      // the own rules only when the sponsor does not use the site defaults (the backend keeps nothing else)
      ...(form.popupUseDefaults
        ? {}
        : {
            popupTrigger: form.popupTrigger,
            popupDelaySeconds: numberOrNull(form.popupDelaySeconds),
            popupScrollPercent: numberOrNull(form.popupScrollPercent),
            popupFrequency: form.popupFrequency,
            popupFrequencyDays: numberOrNull(form.popupFrequencyDays),
          }),
    }
    let current = partner
    let uploading = null // the place whose media is being sent: a refusal of the backend belongs under it
    try {
      // A new sponsor is created OFF: its images can only be uploaded once it exists, and an active sponsor needs the image of
      // every chosen place. For a saved sponsor the images go first too, so the places it is saved with already have theirs.
      if (!current) current = await partnerService.createPartner({ ...payload, active: false })
      for (const place of CHOICES) {
        uploading = place
        current = await uploadMedia(current, place)
      }
      // the square logo has its own call
      uploading = PLACEMENT_BAR
      if (images[PLACEMENT_BAR].file) current = await partnerService.uploadPartnerLogo(current.id, images[PLACEMENT_BAR].file)
      uploading = null
      if (partner) current = await partnerService.updatePartner(current.id, payload)
      if (current.active !== form.active) {
        current = await (form.active ? partnerService.activatePartner(current.id) : partnerService.deactivatePartner(current.id))
      }
      // a logo that was removed: a phone goes back to the square crop of the popup image
      if (images[PLACEMENT_BAR].remove && current.logoUrl) {
        current = await partnerService.deletePartnerLogo(current.id)
      }
    } catch (error) {
      setBusy(false)
      if (!partner && current) {
        // created, but a later step failed: go on with the saved sponsor (its form shows what is missing)
        markClean()
        navigate(adminPartnerPath(current.id), { replace: true, state: { message: t('dashboard.partners.imagesFailed', { message: errorMessage(error) }), error: true } })
        return
      }
      // the field errors (placements, sidebarImage, popupImage, ...) go under their fields, anything else in the alert; a refusal
      // of a media upload (a video of the wrong type, a poster that is missing, a link that is not YouTube) goes under its place
      const raw = error?.details ?? {}
      const details = Object.fromEntries(Object.entries(raw).filter(([field]) => FIELD_ORDER.includes(field)))
      if (uploading) {
        const problem = raw.poster ?? raw.youtubeUrl ?? raw.mediaType ?? raw.altText ?? (Object.keys(details).length === 0 ? errorMessage(error) : null)
        if (problem) details[PLACE_ERROR[uploading]] = problem
      }
      setErrors(details)
      setApiError(Object.keys(details).length > 0 ? null : error)
      if (Object.keys(details).length > 0) revealFirst(details)
      else window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setBusy(false)

    const message = t(partner ? 'dashboard.partners.saved' : 'dashboard.partners.created')
    if (!partner) {
      markClean() // the page changes to the saved sponsor: no "unsaved changes" question
      navigate(adminPartnerPath(current.id), { replace: true, state: { message } })
      return
    }
    PLACEMENT_IDS.forEach(release)
    setPartner(withLogo(current))
    setForm(toForm(current, options.popupDefaults))
    setSaved(JSON.stringify(toForm(current, options.popupDefaults)))
    setImages(freshImages())
    media.reset(current)
    setToast({ variant: 'success', text: message })
  }

  const counter = (field) => t('dashboard.partners.form.counter', { count: form[field].length, max: PARTNER_MAX[field] })
  const urlOk = isHttpsUrl(form.targetUrl.trim())

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <Link to={ROUTES.ADMIN_PARTNERS} className="small">
            &larr; {t('dashboard.partners.form.back')}
          </Link>
          <h1 className="h4 mt-1 mb-0">{partner ? t('dashboard.partners.form.titleEdit') : t('dashboard.partners.form.titleNew')}</h1>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {partner && (
            <Button as={Link} to={adminPartnerStatsPath(partner.id)} variant="outline-secondary">
              <BarChart className="me-1" aria-hidden="true" />
              {t('dashboard.partners.form.stats')}
            </Button>
          )}
        </div>
      </div>

      <ErrorAlert error={apiError} />
      {Object.values(errors).some(Boolean) && <Alert variant="danger">{t('dashboard.partners.errors.fix')}</Alert>}

      <Form id="partner-form" onSubmit={save} noValidate>
        <div className="editor-layout">
          <div className="editor-col editor-col--main">
            <div style={{ order: 1 }}>
              <Card className="editor-field">
                <Card.Header className="bg-surface">
                  <h2 className="h6 mb-0">{t('dashboard.partners.form.main')}</h2>
                </Card.Header>
                <Card.Body>
                  <FormField id="partner-name" label={t('dashboard.partners.form.name')} help={t('dashboard.partners.form.nameHelp')} error={errors.name} value={form.name} maxLength={PARTNER_MAX.name} disabled={busy} onChange={text('name')} />
                  <FormField id="partner-title" label={t('dashboard.partners.form.title')} help={t('dashboard.partners.form.titleHelp')} error={errors.title} value={form.title} maxLength={PARTNER_MAX.title} disabled={busy} onChange={text('title')} />
                  <FormField
                    id="partner-description"
                    as="textarea"
                    rows={3}
                    optional
                    label={t('dashboard.partners.form.description')}
                    help={`${t('dashboard.partners.form.descriptionHelp')} ${counter('description')}`}
                    error={errors.description}
                    value={form.description}
                    maxLength={PARTNER_MAX.description}
                    disabled={busy}
                    onChange={text('description')}
                  />
                  <FormField id="partner-cta" label={t('dashboard.partners.form.ctaText')} help={t('dashboard.partners.form.ctaHelp')} error={errors.ctaText} value={form.ctaText} maxLength={PARTNER_MAX.ctaText} disabled={busy} onChange={text('ctaText')} />
                  <Form.Group controlId="partner-url">
                    <Form.Label>{t('dashboard.partners.form.targetUrl')}</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control type="url" inputMode="url" value={form.targetUrl} maxLength={PARTNER_MAX.targetUrl} disabled={busy} isInvalid={Boolean(errors.targetUrl)} aria-describedby="partner-url-help" onChange={text('targetUrl')} placeholder="https://" />
                      <Button as="a" variant="outline-secondary" href={urlOk ? form.targetUrl.trim() : undefined} target="_blank" rel="noopener noreferrer" disabled={!urlOk} aria-disabled={!urlOk}>
                        <BoxArrowUpRight className="me-1" aria-hidden="true" />
                        {t('dashboard.partners.form.testLink')}
                      </Button>
                      <Form.Control.Feedback type="invalid">{errors.targetUrl}</Form.Control.Feedback>
                    </InputGroup>
                    <Form.Text id="partner-url-help" className="text-muted">
                      {t('dashboard.partners.form.targetHelp')}
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </div>
            <div style={{ order: 3 }}>
              <PartnerPlacesCard
                places={form.placements}
                saved={partner?.creatives ?? []}
                images={images}
                errors={errors}
                disabled={busy}
                onToggle={togglePlace}
                onChoose={chooseImage}
                onUndo={undoImage}
                onAlt={(id, value) => patchImage(id, { alt: value })}
                media={media}
                options={options}
                form={form}
                onFormChange={change}
                title={form.title}
              />
            </div>
            <div style={{ order: 4 }}>
              <LogoCard
                saved={partner?.creatives ?? []}
                image={images[PLACEMENT_BAR]}
                required={logoRequired}
                error={errors.logo}
                disabled={busy}
                onChoose={(file) => chooseImage(PLACEMENT_BAR, file)}
                onRemove={() => removeImage(PLACEMENT_BAR)}
                onUndo={() => undoImage(PLACEMENT_BAR)}
                onAlt={(value) => patchImage(PLACEMENT_BAR, { alt: value })}
              />
            </div>
            <div style={{ order: 5 }}>
              <PartnerPreviewCard draft={form} places={form.placements} shown={shown} />
            </div>
          </div>

          <div className="editor-col editor-col--side">
            <div style={{ order: 2 }}>
              <PublishingCard form={form} errors={errors} disabled={busy} onChange={change} />
            </div>
            <div id="partner-categories" style={{ order: 4 }} tabIndex={-1}>
              <CategoriesCard categories={categories} selected={form.categoryIds} disabled={busy} error={errors.categoryIds} onChange={(ids) => change('categoryIds', ids)} />
            </div>
          </div>
        </div>

        {/* always in reach: saving never needs a scroll to the top */}
        <div className="partner-action-bar" role="group" aria-label={t('dashboard.partners.form.actions')}>
          <Button as={Link} to={ROUTES.ADMIN_PARTNERS} variant="outline-secondary" disabled={busy}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" disabled={busy || !dirty}>
            {busy && <Spinner size="sm" animation="border" className="me-1" />}
            {busy ? t('dashboard.partners.form.saving') : partner ? t('dashboard.partners.form.save') : t('dashboard.partners.form.saveNew')}
          </Button>
        </div>
      </Form>

      <ConfirmDialog show={blocker.state === 'blocked'} title={t('dashboard.partners.form.leaveTitle')} confirmLabel={t('dashboard.partners.form.leaveConfirm')} confirmVariant="danger" onCancel={() => blocker.reset()} onConfirm={() => blocker.proceed()}>
        {t('dashboard.partners.form.leaveBody')}
      </ConfirmDialog>

      <ToastContainer position="bottom-end" className="p-3 editor-toasts" style={{ zIndex: 2000 }}>
        <Toast bg={toast?.variant ?? 'success'} show={Boolean(toast)} onClose={() => setToast(null)} delay={6000} autohide>
          <Toast.Body className="text-white d-flex justify-content-between gap-3">
            <span>{toast?.text}</span>
            <button type="button" className="btn-close btn-close-white" aria-label={t('common.actions.close')} onClick={() => setToast(null)} />
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}

// /admin/partners/new and /admin/partners/:id: loads the sponsor (when editing) and the active categories, then the form
export default function PartnerEditorPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const key = id ?? 'new'
  // the options (the site defaults of the popup and the limits) are a help: without them the form uses the backend's own numbers
  const { data, error, loading } = useRemoteData(key, () =>
    Promise.all([id ? partnerService.getPartner(id) : Promise.resolve(null), categoryService.listActiveCategories(), partnerService.getPartnerOptions().catch(() => OPTIONS_FALLBACK)]),
  )

  if (loading) return <PageSpinner />
  if (error) {
    return (
      <div>
        <ErrorAlert error={error} message={error.code === 404 ? t('dashboard.partners.form.notFound') : undefined} />
        <Link to={ROUTES.ADMIN_PARTNERS}>{t('dashboard.partners.form.back')}</Link>
      </div>
    )
  }
  const [partner, categories, options] = data
  return <PartnerForm key={key} initial={withLogo(partner)} categories={categories ?? []} options={options} />
}
