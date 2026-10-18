import { useState } from 'react'
import { Alert, Button, Card, Col, Form, Row, Tab, Tabs } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import ColorField from '../../components/settings/ColorField'
import HeaderPreview from '../../components/settings/HeaderPreview'
import ImageSettingCard from '../../components/settings/ImageSettingCard'
import SettingField from '../../components/settings/SettingField'
import { DEFAULT_SETTINGS, IMAGE_SETTINGS, SETTINGS_TABS } from '../../constants/siteSettings'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useRemoteData } from '../../hooks/useRemoteData'
import { useSettings } from '../../hooks/useSettings'
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning'
import * as settingsService from '../../services/settingsService'
import { DEFAULT_ACCENT, DEFAULT_PRIMARY } from '../../utils/sitePalette'
import { cleanSetting, validateSetting } from '../../utils/settingsValidation'

const pick = (source, keys) => Object.fromEntries(keys.filter((key) => key in source).map((key) => [key, source[key]]))

// ---- the form ----

function SettingsEditor({ initial }) {
  const { t, i18n } = useTranslation()
  const { merge, logoSrc } = useSettings()
  const [saved, setSaved] = useState(initial) // what the backend has
  const [draft, setDraft] = useState(initial) // what is typed in the form
  const [tab, setTab] = useState('general')
  const [errors, setErrors] = useState({}) // setting key -> problem (from the form checks or from the backend)
  const [apiError, setApiError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null) // the tab that was just saved
  const [discardTo, setDiscardTo] = useState(null) // the tab the admin wants to go to, while the dialog asks about the changes

  const tabKeys = (id) => SETTINGS_TABS.find((entry) => entry.id === id).keys
  const changedKeys = (id) => tabKeys(id).filter((key) => draft[key] !== saved[key])
  const dirtyTabs = SETTINGS_TABS.filter((entry) => changedKeys(entry.id).length > 0).map((entry) => entry.id)
  const { blocker } = useUnsavedChangesWarning(dirtyTabs.length > 0)

  const clearMessages = () => {
    setErrors({})
    setApiError(null)
    setDone(null)
  }

  const change = (key) => (value) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setDone(null)
  }

  const discard = (id) => {
    setDraft((current) => ({ ...current, ...pick(saved, tabKeys(id)) }))
    clearMessages()
  }

  const select = (next) => {
    if (next === tab) return
    if (changedKeys(tab).length > 0) {
      setDiscardTo(next) // the dialog asks before the changes of this tab are lost
      return
    }
    clearMessages()
    setTab(next)
  }

  // an image was uploaded or removed (saved at once, not part of a tab's "Save changes")
  const imageChanged = (values) => {
    setSaved((current) => ({ ...current, ...values }))
    setDraft((current) => ({ ...current, ...values }))
    merge(values)
  }

  const save = async (id) => {
    const keys = changedKeys(id)
    const found = {}
    keys.forEach((key) => {
      const problem = validateSetting(key, draft[key])
      if (problem) found[key] = problem
    })
    setApiError(null)
    setDone(null)
    setErrors(found)
    if (Object.keys(found).length > 0 || keys.length === 0) return

    setBusy(true)
    try {
      const result = await settingsService.updateSettings(id, Object.fromEntries(keys.map((key) => [key, cleanSetting(draft[key])])))
      const group = pick(result, tabKeys(id)) // the values as the backend saved them (trimmed, a colour in capitals, ...)
      setSaved((current) => ({ ...current, ...group }))
      setDraft((current) => ({ ...current, ...group }))
      merge(result) // the header, the footer and the browser tab change at once
      setDone(id)
    } catch (error) {
      setErrors(error.details ?? {})
      setApiError(error)
    } finally {
      setBusy(false)
    }
  }

  // ---- pieces ----

  const label = (key) => t(`dashboard.settings.fields.${key}.label`)
  const help = (key) => {
    const text = t(`dashboard.settings.fields.${key}.help`, { defaultValue: '' })
    return text || undefined
  }

  const field = (key, extra = {}) => (
    <SettingField
      id={`setting-${key}`}
      settingKey={key}
      label={label(key)}
      help={help(key)}
      value={draft[key] ?? ''}
      onChange={change(key)}
      error={errors[key]}
      lang={key.endsWith('_km') ? 'km' : undefined}
      disabled={busy}
      {...extra}
    />
  )

  const pair = (englishKey, khmerKey) => (
    <Row>
      <Col md={6}>{field(englishKey)}</Col>
      <Col md={6}>{field(khmerKey)}</Col>
    </Row>
  )

  const colorField = (key, defaultValue) => (
    <ColorField id={`setting-${key}`} label={label(key)} value={draft[key] ?? ''} onChange={change(key)} error={errors[key]} defaultValue={defaultValue} />
  )

  const switchField = (key) => (
    <Form.Group className="mb-3" controlId={`setting-${key}`}>
      <Form.Check
        type="switch"
        label={label(key)}
        checked={draft[key] === 'true'}
        disabled={busy}
        onChange={(event) => change(key)(event.target.checked ? 'true' : 'false')}
        aria-describedby={`setting-${key}-help`}
      />
      {help(key) && (
        <Form.Text id={`setting-${key}-help`} className="text-muted">
          {help(key)}
        </Form.Text>
      )}
    </Form.Group>
  )

  const previewName = i18n.language === 'km' && draft.site_name_km ? draft.site_name_km : draft.site_name_en

  const preview = (
    <Card className="mb-4">
      <Card.Header>
        <h2 className="h6 mb-0">{t('dashboard.settings.preview.heading')}</h2>
      </Card.Header>
      <Card.Body>
        <HeaderPreview siteName={previewName || DEFAULT_SETTINGS.site_name_en} logoSrc={logoSrc} primary={draft.primary_color} accent={draft.accent_color} />
        <p className="small text-muted mt-2 mb-0">{t('dashboard.settings.preview.hint')}</p>
      </Card.Body>
    </Card>
  )

  const footer = (id) => {
    const dirty = changedKeys(id).length > 0
    const fieldProblems = Object.values(errors).some(Boolean)
    return (
      <div className="mt-3">
        {apiError && tab === id && (fieldProblems && apiError.details ? <Alert variant="danger">{t('dashboard.settings.fixErrors')}</Alert> : <ErrorAlert error={apiError} />)}
        {!apiError && fieldProblems && <Alert variant="danger">{t('dashboard.settings.fixErrors')}</Alert>}
        {done === id && <Alert variant="success">{t('dashboard.settings.saved')}</Alert>}
        <div className="d-flex flex-wrap gap-2">
          <Button onClick={() => save(id)} disabled={busy || !dirty}>
            {busy ? t('common.actions.saving') : t('dashboard.settings.actions.save')}
          </Button>
          <Button variant="outline-secondary" onClick={() => discard(id)} disabled={busy || !dirty}>
            {t('dashboard.settings.actions.discard')}
          </Button>
        </div>
      </div>
    )
  }

  const tabTitle = (id) => (
    <span>
      {t(`dashboard.settings.tabs.${id}`)}
      {dirtyTabs.includes(id) && (
        <>
          <span aria-hidden="true" className="ms-1 text-warning">
            &bull;
          </span>
          <span className="visually-hidden"> ({t('dashboard.settings.unsaved')})</span>
        </>
      )}
    </span>
  )

  const section = (title, children) => (
    <Card className="mb-4">
      <Card.Header>
        <h2 className="h6 mb-0">{title}</h2>
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  )

  return (
    <>
      <Tabs activeKey={tab} onSelect={(key) => key && select(key)} className="mb-3 flex-wrap" id="settings-tabs">
        <Tab eventKey="general" title={tabTitle('general')}>
          {preview}
          {section(
            t('dashboard.settings.sections.names'),
            <>
              {pair('site_name_en', 'site_name_km')}
              {pair('tagline_en', 'tagline_km')}
              <Row>
                <Col md={6}>{field('dashboard_name')}</Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="setting-default_language">
                    <Form.Label>{label('default_language')}</Form.Label>
                    <Form.Select value={draft.default_language ?? 'en'} disabled={busy} isInvalid={Boolean(errors.default_language)} onChange={(event) => change('default_language')(event.target.value)}>
                      <option value="en">English</option>
                      <option value="km" lang="km">
                        ខ្មែរ
                      </option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.default_language}</Form.Control.Feedback>
                    <Form.Text className="text-muted">{help('default_language')}</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              {field('title_format')}
            </>,
          )}
          {footer('general')}
        </Tab>

        <Tab eventKey="branding" title={tabTitle('branding')}>
          {preview}
          {section(
            t('dashboard.settings.sections.colors'),
            <Row>
              <Col md={6}>{colorField('primary_color', DEFAULT_PRIMARY)}</Col>
              <Col md={6}>{colorField('accent_color', DEFAULT_ACCENT)}</Col>
            </Row>,
          )}
          {footer('branding')}
          <div className="mt-4">
            {section(
              t('dashboard.settings.sections.images'),
              <>
                <p className="text-muted small">{t('dashboard.settings.images.intro')}</p>
                <Row className="g-3">
                  {IMAGE_SETTINGS.map((image) => (
                    <Col key={image.type} sm={6} xl={3}>
                      <ImageSettingCard
                        type={image.type}
                        settingKey={image.key}
                        group={image.group}
                        title={t(`dashboard.settings.images.titles.${image.type}`)}
                        help={t(`dashboard.settings.images.helps.${image.type}`)}
                        path={saved[image.key] ?? ''}
                        darkPreview={image.type === 'logo-dark'}
                        onChanged={imageChanged}
                      />
                    </Col>
                  ))}
                </Row>
              </>,
            )}
          </div>
        </Tab>

        <Tab eventKey="website" title={tabTitle('website')}>
          {section(
            t('dashboard.settings.sections.footer'),
            <>
              {pair('footer_description_en', 'footer_description_km')}
              {field('copyright_text')}
            </>,
          )}
          {section(
            t('dashboard.settings.sections.contact'),
            <>
              <Row>
                <Col md={6}>{field('contact_email', { type: 'email' })}</Col>
                <Col md={6}>{field('contact_phone', { type: 'tel' })}</Col>
              </Row>
              {field('contact_address')}
            </>,
          )}
          {section(
            t('dashboard.settings.sections.social'),
            <Row>
              <Col md={6}>{field('social_facebook', { type: 'url' })}</Col>
              <Col md={6}>{field('social_telegram', { type: 'url' })}</Col>
              <Col md={6}>{field('social_youtube', { type: 'url' })}</Col>
              <Col md={6}>{field('social_tiktok', { type: 'url' })}</Col>
            </Row>,
          )}
          {footer('website')}
        </Tab>

        <Tab eventKey="seo" title={tabTitle('seo')}>
          {section(
            t('dashboard.settings.sections.search'),
            <>
              {pair('meta_description_en', 'meta_description_km')}
              <p className="small text-muted mb-0">{t('dashboard.settings.seoImageHint')}</p>
            </>,
          )}
          {footer('seo')}
        </Tab>

        <Tab eventKey="content" title={tabTitle('content')}>
          {section(
            t('dashboard.settings.sections.news'),
            <>
              <Row>
                <Col md={4}>{field('news_per_page', { type: 'number', inputMode: 'numeric' })}</Col>
              </Row>
              {switchField('comments_enabled_default')}
              {switchField('show_view_count')}
            </>,
          )}
          {footer('content')}
        </Tab>
      </Tabs>

      <ConfirmDialog
        show={discardTo !== null}
        title={t('dashboard.settings.discard.title')}
        confirmLabel={t('dashboard.settings.discard.confirm')}
        confirmVariant="danger"
        onCancel={() => setDiscardTo(null)}
        onConfirm={() => {
          discard(tab)
          setTab(discardTo)
          setDiscardTo(null)
        }}
      >
        {t('dashboard.settings.discard.body', { tab: t(`dashboard.settings.tabs.${tab}`) })}
      </ConfirmDialog>
      <ConfirmDialog show={blocker.state === 'blocked'} title={t('dashboard.settings.leave.title')} confirmLabel={t('dashboard.settings.leave.confirm')} confirmVariant="danger" onCancel={() => blocker.reset()} onConfirm={() => blocker.proceed()}>
        {t('dashboard.settings.leave.body')}
      </ConfirmDialog>
    </>
  )
}

// ---- the page: loads every setting, then shows the form ----

export default function SettingsPage() {
  const { t } = useTranslation()
  usePageMeta(t('dashboard.settings.title'))
  const { data, error, loading } = useRemoteData('settings-all', () => settingsService.getAllSettings())
  const flat = data ? Object.assign({}, ...Object.values(data)) : null

  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 className="h4 mb-1">{t('dashboard.settings.title')}</h1>
      <p className="text-muted mb-4">{t('dashboard.settings.intro')}</p>
      <ErrorAlert error={error} />
      {loading && <PageSpinner />}
      {flat && <SettingsEditor initial={flat} />}
    </div>
  )
}
