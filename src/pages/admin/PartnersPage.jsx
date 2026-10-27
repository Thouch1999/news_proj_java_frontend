import { useEffect, useState } from 'react'
import { Badge, Button, Card, Dropdown, Form, Spinner, Table, Toast, ToastContainer } from 'react-bootstrap'
import { BarChart, Copy, ExclamationTriangle, Image, Megaphone, PencilSquare, ThreeDots, Trash } from 'react-bootstrap-icons'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { EmptyState, ErrorState, RowsSkeleton } from '../../components/common/ListStates'
import SearchBox from '../../components/common/SearchBox'
import { StatusTabs } from '../../components/news/ArticleListParts'
import { CHOICES, MEDIA_ICON, MEDIA_IMAGE, MEDIA_VIDEO, MEDIA_YOUTUBE, PARTNER_LIST_SIZE, PARTNER_MAX, PARTNER_STATUSES, PLACEMENT_BAR, PLACEMENT_POPUP, PLACEMENT_SIDEBAR, youtubeLink } from '../../constants/promo'
import { adminPartnerPath, adminPartnerStatsPath, ROUTES } from '../../constants/routes'
import { useFormat } from '../../hooks/useFormat'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import * as partnerService from '../../services/partnerService'
import { errorMessage } from '../../utils/errorMessage'
import { mediaUrl } from '../../utils/mediaUrl'

const STATUS_VARIANT = { active: 'success', scheduled: 'info', ended: 'secondary', inactive: 'secondary' }

// a stable object, so the menu is placed right on the first click
const MENU_POPPER = { strategy: 'fixed' }

// The picture of the sidebar (the main image), or an icon when that place has no image
function Thumb({ partner }) {
  const [broken, setBroken] = useState(null)
  // the sidebar picture, else the popup picture (the bar picture is a small square: the last choice)
  const image = [PLACEMENT_SIDEBAR, PLACEMENT_POPUP, PLACEMENT_BAR].map((place) => partner.creatives.find((creative) => creative.placement === place)).find(Boolean)
  if (!image || broken === image.imageUrl) {
    return (
      <span className="partner-thumb partner-thumb--empty" aria-hidden="true">
        <Image />
      </span>
    )
  }
  return <img src={mediaUrl(image.imageUrl)} alt="" className="partner-thumb" loading="lazy" onError={() => setBroken(image.imageUrl)} />
}

function NameCell({ partner, logosLayout }) {
  const { t } = useTranslation()
  // the sidebar layout "Logos" skips a sponsor without a logo: an active one is warned about
  const noLogo = logosLayout && partner.active && partner.placements?.includes(PLACEMENT_SIDEBAR) && !partner.logoUrl
  return (
    <div className="d-flex align-items-center gap-3">
      <Thumb partner={partner} />
      <div className="partner-name">
        <Link to={adminPartnerPath(partner.id)} className="article-title news-title" title={partner.name}>
          {partner.name}
        </Link>
        <div className="text-muted article-category news-title">{partner.title}</div>
        {noLogo && (
          <div className="small text-warning-emphasis" role="note">
            <ExclamationTriangle className="me-1" aria-hidden="true" />
            {t('dashboard.partners.noLogoWarning')}
          </div>
        )}
      </div>
    </div>
  )
}

function Placements({ partner }) {
  const { t } = useTranslation()
  // the places the admin chose (not the places that happen to have an image)
  const used = CHOICES.filter((id) => partner.placements?.includes(id))
  if (used.length === 0) return <span className="text-muted small">{t('dashboard.partners.noPlacement')}</span>
  return (
    <span className="d-inline-flex flex-wrap gap-1">
      {used.map((id) => {
        // a small icon says what the place shows: a picture, a video file or a YouTube video
        const type = partner.creatives.find((creative) => creative.placement === id)?.mediaType ?? MEDIA_IMAGE
        const Icon = MEDIA_ICON[type]
        return (
          <Badge key={id} bg="" className="partner-badge" title={t(`dashboard.partners.media.types.${type}`)}>
            <Icon className="me-1" size={12} aria-hidden="true" />
            {t(`dashboard.partners.placements.${id}`)}
            <span className="visually-hidden"> ({t(`dashboard.partners.media.types.${type}`)})</span>
          </Badge>
        )
      })}
    </span>
  )
}

function Dates({ partner }) {
  const { t } = useTranslation()
  const { formatDate } = useFormat()
  let text = t('dashboard.partners.dates.always')
  if (partner.startAt && partner.endAt) text = t('dashboard.partners.dates.range', { from: formatDate(partner.startAt), to: formatDate(partner.endAt) })
  else if (partner.startAt) text = t('dashboard.partners.dates.from', { date: formatDate(partner.startAt) })
  else if (partner.endAt) text = t('dashboard.partners.dates.until', { date: formatDate(partner.endAt) })
  return (
    <div>
      <div className="small text-nowrap">{text}</div>
      <Badge bg={STATUS_VARIANT[partner.status]} text={partner.status === 'scheduled' ? 'dark' : undefined} className="fw-normal">
        {t(`dashboard.partners.tabs.${partner.status}`)}
      </Badge>
    </div>
  )
}

// the on/off switch: it changes when the backend has answered (a spinner meanwhile), so a failure leaves it where it was
function ActiveSwitch({ partner, busy, onToggle }) {
  const { t } = useTranslation()
  return (
    <span className="d-inline-flex align-items-center gap-2">
      <Form.Check type="switch" id={`partner-active-${partner.id}`} className="mb-0" checked={partner.active} disabled={busy} aria-label={t('dashboard.partners.activeSwitch', { name: partner.name })} onChange={() => onToggle(partner)} />
      {busy && <Spinner size="sm" animation="border" />}
    </span>
  )
}

function Actions({ partner, onDuplicate, onDelete }) {
  const { t } = useTranslation()
  return (
    <div className="d-inline-flex align-items-center gap-1">
      <Button as={Link} to={adminPartnerPath(partner.id)} size="sm" variant="light" className="icon-btn" aria-label={t('dashboard.partners.actions.edit')} title={t('dashboard.partners.actions.edit')}>
        <PencilSquare aria-hidden="true" />
      </Button>
      <Dropdown align="end">
        <Dropdown.Toggle size="sm" variant="light" className="icon-btn article-more" aria-label={t('news.list.actions.more')} title={t('news.list.actions.more')}>
          <ThreeDots aria-hidden="true" />
        </Dropdown.Toggle>
        <Dropdown.Menu popperConfig={MENU_POPPER}>
          <Dropdown.Item as={Link} to={adminPartnerPath(partner.id)}>
            <PencilSquare className="me-2" aria-hidden="true" />
            {t('dashboard.partners.actions.edit')}
          </Dropdown.Item>
          <Dropdown.Item as={Link} to={adminPartnerStatsPath(partner.id)}>
            <BarChart className="me-2" aria-hidden="true" />
            {t('dashboard.partners.actions.stats')}
          </Dropdown.Item>
          <Dropdown.Item onClick={() => onDuplicate(partner)}>
            <Copy className="me-2" aria-hidden="true" />
            {t('dashboard.partners.actions.duplicate')}
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item className="text-danger" onClick={() => onDelete(partner)}>
            <Trash className="me-2" aria-hidden="true" />
            {t('dashboard.partners.actions.delete')}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  )
}

// The sponsors: tabs by status with their numbers, a search, a table (cards on a phone) with the views, the clicks and the
// click rate of the last 30 days, the on/off switch and the "..." menu. Every sponsor comes at once (the backend gives 100
// per page), so the tabs and the search work in the browser.
export default function PartnersPage() {
  const { t } = useTranslation()
  const { formatNumber, formatPercent } = useFormat()
  usePageMeta(t('dashboard.partners.title'))
  const [searchParams, setSearchParams] = useSearchParams()
  const status = PARTNER_STATUSES.includes(searchParams.get('status') ?? '') ? searchParams.get('status') : ''
  const query = searchParams.get('q') ?? ''
  const placement = CHOICES.includes(searchParams.get('placement') ?? '') ? searchParams.get('placement') : ''

  // the sidebar layout (a setting): with "Logos" a sponsor needs its logo
  const { data: options } = useRemoteData('partners-options', () => partnerService.getPartnerOptions().catch(() => null))
  const logosLayout = options?.sidebar?.layout === 'LOGOS_4'

  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ partners: null, totals: {}, error: null })
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState(null) // the partner to delete
  const [deleting, setDeleting] = useState(false)
  const [copying, setCopying] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let current = true
    Promise.all([partnerService.listPartners({ size: PARTNER_LIST_SIZE }), partnerService.getPartnerSummary().catch(() => null)])
      .then(([list, summary]) => {
        if (!current) return
        const totals = Object.fromEntries((summary?.sponsors ?? []).map((row) => [row.sponsorId, row]))
        setState({ partners: list.items, totals, error: null })
      })
      .catch((error) => current && setState((previous) => ({ ...previous, error: previous.partners ? null : error })))
    return () => {
      current = false
    }
  }, [reloadKey])
  const reload = () => setReloadKey((key) => key + 1)
  const { partners, totals, error } = state
  const patch = (change) => setState((previous) => ({ ...previous, partners: change(previous.partners ?? []) }))

  const setParams = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([name, value]) => (value ? next.set(name, value) : next.delete(name)))
    setSearchParams(next, { replace: true })
  }

  const needle = query.trim().toLowerCase()
  const shown = (partners ?? []).filter((partner) => (!status || partner.status === status) && (!placement || partner.placements?.includes(placement)) && (!needle || partner.name.toLowerCase().includes(needle) || partner.title.toLowerCase().includes(needle)))
  const count = (value) => (partners ?? []).filter((partner) => !value || partner.status === value).length
  const tabs = ['', ...PARTNER_STATUSES].map((value) => ({ value, label: t(`dashboard.partners.tabs.${value || 'all'}`), count: partners ? count(value) : undefined }))

  const toggle = async (partner) => {
    setBusyId(partner.id)
    try {
      const saved = await (partner.active ? partnerService.deactivatePartner(partner.id) : partnerService.activatePartner(partner.id))
      patch((list) => list.map((item) => (item.id === saved.id ? saved : item)))
      setToast({ variant: 'success', text: t(saved.active ? 'dashboard.partners.activated' : 'dashboard.partners.deactivated') })
    } catch (caught) {
      setToast({ variant: 'danger', text: errorMessage(caught) })
    } finally {
      setBusyId(null)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      await partnerService.deletePartner(confirm.id)
      patch((list) => list.filter((item) => item.id !== confirm.id))
      setToast({ variant: 'success', text: t('dashboard.partners.deleted') })
    } catch (caught) {
      setToast({ variant: 'danger', text: errorMessage(caught) })
      reload()
    } finally {
      setDeleting(false)
      setConfirm(null)
    }
  }

  // the stored file at an address of the backend, as a File to upload again
  const fetchFile = async (path, name) => {
    const response = await fetch(mediaUrl(path))
    if (!response.ok) throw new Error('file')
    const blob = await response.blob()
    return new File([blob], name, { type: blob.type })
  }

  // A copy starts switched off. The media is fetched and uploaded again (the backend has no copy call).
  const duplicate = async (partner) => {
    if (copying) return
    setCopying(true)
    try {
      const created = await partnerService.createPartner({
        name: `${partner.name} ${t('dashboard.partners.copySuffix')}`.slice(0, PARTNER_MAX.name),
        title: partner.title,
        description: partner.description,
        ctaText: partner.ctaText,
        targetUrl: partner.targetUrl,
        active: false,
        startAt: partner.startAt,
        endAt: partner.endAt,
        weight: partner.weight,
        language: partner.language,
        placements: partner.placements,
        categoryIds: partner.categoryIds,
        popupUseDefaults: partner.popupUseDefaults,
        ...(partner.popupUseDefaults
          ? {}
          : {
              popupTrigger: partner.popupTrigger,
              popupDelaySeconds: partner.popupDelaySeconds,
              popupScrollPercent: partner.popupScrollPercent,
              popupFrequency: partner.popupFrequency,
              popupFrequencyDays: partner.popupFrequencyDays,
            }),
      })
      let imagesFailed = false
      for (const creative of partner.creatives) {
        if (creative.generated) continue // the server cuts the bar picture again from the popup picture
        try {
          if (creative.mediaType === MEDIA_VIDEO) {
            const video = await fetchFile(creative.videoUrl, 'video')
            const poster = await fetchFile(creative.imageUrl, 'poster')
            await partnerService.uploadPartnerVideo(created.id, creative.placement, video, poster, creative.altText)
          } else if (creative.mediaType === MEDIA_YOUTUBE) {
            // an uploaded poster is copied; without one the copy uses the YouTube thumbnail like the original
            const poster = creative.imageUrl.startsWith('/uploads/') ? await fetchFile(creative.imageUrl, 'poster') : null
            await partnerService.uploadPartnerYoutube(created.id, creative.placement, youtubeLink(creative.youtubeId), poster, creative.altText)
          } else {
            await partnerService.uploadPartnerImage(created.id, creative.placement, await fetchFile(creative.imageUrl, 'image'), creative.altText)
          }
        } catch {
          imagesFailed = true
        }
      }
      if (partner.logoUrl) {
        try {
          await partnerService.uploadPartnerLogo(created.id, await fetchFile(partner.logoUrl, 'logo'))
        } catch {
          imagesFailed = true
        }
      }
      reload()
      setToast(imagesFailed ? { variant: 'danger', text: t('dashboard.partners.duplicatedNoImages') } : { variant: 'success', text: t('dashboard.partners.duplicated') })
    } catch (caught) {
      setToast({ variant: 'danger', text: errorMessage(caught) })
    } finally {
      setCopying(false)
    }
  }

  const stat = (partner) => totals[partner.id] ?? { impressions: 0, clicks: 0, clickRate: 0 }
  const noMatch = partners && partners.length > 0 && shown.length === 0

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h1 className="h4 mb-1">{t('dashboard.partners.title')}</h1>
          <p className="text-muted small mb-0">{t('dashboard.partners.intro')}</p>
        </div>
        <Button as={Link} to={ROUTES.ADMIN_PARTNER_NEW}>
          {t('dashboard.partners.create')}
        </Button>
      </div>

      <StatusTabs tabs={tabs} active={status} label={t('dashboard.partners.status')} onChange={(value) => setParams({ status: value })} />

      <Card className="article-card">
        <div className="article-toolbar p-3">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <SearchBox value={query} onChange={(value) => setParams({ q: value })} label={t('dashboard.partners.search')} placeholder={t('dashboard.partners.search')} />
            <Form.Select size="sm" className="w-auto" aria-label={t('dashboard.partners.filters.placement')} value={placement} onChange={(event) => setParams({ placement: event.target.value })}>
              <option value="">{t('dashboard.partners.filters.allPlaces')}</option>
              {CHOICES.map((id) => (
                <option key={id} value={id}>
                  {t(`dashboard.partners.placements.${id}`)}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>

        {!partners && !error && <RowsSkeleton />}
        {!partners && error && <ErrorState error={error} onRetry={reload} />}
        {partners && partners.length === 0 && (
          <EmptyState icon={Megaphone} text={t('dashboard.partners.empty.none')}>
            <Button as={Link} to={ROUTES.ADMIN_PARTNER_NEW} size="sm">
              {t('dashboard.partners.create')}
            </Button>
          </EmptyState>
        )}
        {noMatch && (
          <EmptyState icon={Megaphone} text={t('dashboard.partners.empty.search')}>
            <Button size="sm" variant="outline-primary" onClick={() => setSearchParams({}, { replace: true })}>
              {t('news.list.toolbar.clear')}
            </Button>
          </EmptyState>
        )}

        {shown.length > 0 && (
          <>
            <div className="article-table-wrap d-none d-md-block">
              <Table hover className="article-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>{t('dashboard.partners.columns.sponsor')}</th>
                    <th>{t('dashboard.partners.columns.placements')}</th>
                    <th>{t('dashboard.partners.columns.dates')}</th>
                    <th className="text-end">{t('dashboard.partners.columns.weight')}</th>
                    <th className="text-end">{t('dashboard.partners.columns.views')}</th>
                    <th className="text-end">{t('dashboard.partners.columns.clicks')}</th>
                    <th className="text-end">{t('dashboard.partners.columns.rate')}</th>
                    <th>{t('dashboard.partners.columns.active')}</th>
                    <th className="text-end">{t('dashboard.partners.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((partner) => (
                    <tr key={partner.id} className={partner.active ? undefined : 'is-inactive'}>
                      <td>
                        <NameCell partner={partner} logosLayout={logosLayout} />
                      </td>
                      <td>
                        <Placements partner={partner} />
                      </td>
                      <td>
                        <Dates partner={partner} />
                      </td>
                      <td className="text-end">{formatNumber(partner.weight)}</td>
                      <td className="text-end">{formatNumber(stat(partner).impressions)}</td>
                      <td className="text-end">{formatNumber(stat(partner).clicks)}</td>
                      <td className="text-end">{formatPercent(stat(partner).clickRate)}</td>
                      <td>
                        <ActiveSwitch partner={partner} busy={busyId === partner.id} onToggle={toggle} />
                      </td>
                      <td className="text-end text-nowrap">
                        <Actions partner={partner} onDuplicate={duplicate} onDelete={setConfirm} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <ul className="article-cards list-unstyled mb-0 d-md-none">
              {shown.map((partner) => (
                <li key={partner.id} className={partner.active ? undefined : 'is-inactive'}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <NameCell partner={partner} logosLayout={logosLayout} />
                    <Actions partner={partner} onDuplicate={duplicate} onDelete={setConfirm} />
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2 mt-2 small">
                    <Placements partner={partner} />
                    <Dates partner={partner} />
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2 small">
                    <span className="text-muted">
                      {t('dashboard.partners.columns.views')}: {formatNumber(stat(partner).impressions)} &middot; {t('dashboard.partners.columns.clicks')}: {formatNumber(stat(partner).clicks)} &middot; {formatPercent(stat(partner).clickRate)}
                    </span>
                    <ActiveSwitch partner={partner} busy={busyId === partner.id} onToggle={toggle} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <ConfirmDialog show={confirm !== null} title={t('dashboard.partners.deleteTitle')} confirmLabel={t('common.actions.delete')} confirmVariant="danger" busy={deleting} onCancel={() => setConfirm(null)} onConfirm={remove}>
        {confirm && <Trans i18nKey="dashboard.partners.deleteText" values={{ name: confirm.name }} components={{ 1: <strong /> }} />}
      </ConfirmDialog>

      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 2000 }}>
        <Toast bg={toast?.variant ?? 'success'} show={Boolean(toast)} onClose={() => setToast(null)} delay={5000} autohide>
          <Toast.Body className="text-white d-flex justify-content-between gap-3">
            <span>{toast?.text}</span>
            <button type="button" className="btn-close btn-close-white" aria-label={t('common.actions.close')} onClick={() => setToast(null)} />
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
