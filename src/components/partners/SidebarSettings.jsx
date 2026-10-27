import { Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { SIDEBAR_COUNT_MAX, SIDEBAR_COUNT_MIN, SIDEBAR_INTERVAL_MAX, SIDEBAR_INTERVAL_MIN, SIDEBAR_LAYOUTS } from '../../constants/promo'
import { useFormat } from '../../hooks/useFormat'

// The "Sidebar" controls of Settings > Content > Sponsors: sponsors per slide, the layout as three visual radio cards, the
// auto-rotate switch and "Change every ... seconds". The values are the texts of the settings (the page saves them as text).
//   draft: the setting values   errors: setting key -> problem   onChange(key)(value)

// the drawing of a layout: what one slide looks like (the grey boxes are the media, the thin bars the titles)
function LayoutDrawing({ layout }) {
  if (layout === 'LOGOS_4') {
    return (
      <svg viewBox="0 0 64 40" className="partner-layout__drawing" aria-hidden="true" focusable="false">
        {[0, 1].flatMap((row) => [0, 1, 2, 3].map((col) => <rect key={`${row}-${col}`} x={2 + col * 15.5} y={6 + row * 17} width="13" height="13" rx="2" fill="currentColor" opacity="0.55" />))}
      </svg>
    )
  }
  if (layout === 'GRID_2') {
    return (
      <svg viewBox="0 0 64 40" className="partner-layout__drawing" aria-hidden="true" focusable="false">
        {[0, 1].map((col) => (
          <g key={col}>
            <rect x={3 + col * 31} y="3" width="27" height="20" rx="2" fill="currentColor" opacity="0.55" />
            <rect x={3 + col * 31} y="27" width="27" height="3" rx="1.5" fill="currentColor" opacity="0.8" />
            <rect x={3 + col * 31} y="33" width="17" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
          </g>
        ))}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 40" className="partner-layout__drawing" aria-hidden="true" focusable="false">
      <rect x="6" y="2" width="52" height="24" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="6" y="29" width="34" height="3" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="6" y="35" width="52" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

export default function SidebarSettings({ draft, errors, disabled, onChange }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const rotate = draft.sponsor_sidebar_rotate === 'true'
  const interval = Number.parseInt(draft.sponsor_sidebar_interval_seconds, 10)

  return (
    <div>
      <Form.Group className="mb-3" controlId="setting-sponsor_sidebar_count">
        <Form.Label>{t('dashboard.settings.fields.sponsor_sidebar_count.label')}</Form.Label>
        <Form.Control
          type="number"
          inputMode="numeric"
          className="partner-narrow-input"
          min={SIDEBAR_COUNT_MIN}
          max={SIDEBAR_COUNT_MAX}
          value={draft.sponsor_sidebar_count ?? ''}
          disabled={disabled}
          isInvalid={Boolean(errors.sponsor_sidebar_count)}
          aria-describedby="setting-sponsor_sidebar_count-help"
          onChange={(event) => onChange('sponsor_sidebar_count')(event.target.value)}
        />
        <Form.Control.Feedback type="invalid">{errors.sponsor_sidebar_count}</Form.Control.Feedback>
        <Form.Text id="setting-sponsor_sidebar_count-help" className="text-muted">
          {t('dashboard.settings.fields.sponsor_sidebar_count.help')}
        </Form.Text>
      </Form.Group>

      <fieldset className="mb-3" aria-describedby="setting-sponsor_sidebar_layout-help">
        <legend className="form-label fs-6">{t('dashboard.settings.fields.sponsor_sidebar_layout.label')}</legend>
        <div className="partner-layout-list">
          {SIDEBAR_LAYOUTS.map((layout) => {
            const checked = draft.sponsor_sidebar_layout === layout
            return (
              <label key={layout} className={`partner-layout${checked ? ' is-checked' : ''}`} htmlFor={`setting-sponsor_sidebar_layout-${layout}`}>
                <input
                  id={`setting-sponsor_sidebar_layout-${layout}`}
                  type="radio"
                  className="partner-layout__input"
                  name="sponsor_sidebar_layout"
                  value={layout}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onChange('sponsor_sidebar_layout')(layout)}
                />
                <LayoutDrawing layout={layout} />
                <span className="partner-layout__name">{t(`dashboard.settings.options.sponsor_sidebar_layout.${layout}`)}</span>
              </label>
            )
          })}
        </div>
        {errors.sponsor_sidebar_layout && <div className="text-danger small mt-1">{errors.sponsor_sidebar_layout}</div>}
        <Form.Text id="setting-sponsor_sidebar_layout-help" className="text-muted d-block mt-1">
          {t('dashboard.settings.fields.sponsor_sidebar_layout.help')}
        </Form.Text>
      </fieldset>

      <Form.Group className="mb-3" controlId="setting-sponsor_sidebar_rotate">
        <Form.Check
          type="switch"
          label={t('dashboard.settings.fields.sponsor_sidebar_rotate.label')}
          checked={rotate}
          disabled={disabled}
          aria-describedby="setting-sponsor_sidebar_rotate-help"
          onChange={(event) => onChange('sponsor_sidebar_rotate')(event.target.checked ? 'true' : 'false')}
        />
        <Form.Text id="setting-sponsor_sidebar_rotate-help" className="text-muted">
          {t('dashboard.settings.fields.sponsor_sidebar_rotate.help')}
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3" controlId="setting-sponsor_sidebar_interval_seconds">
        <Form.Label className={rotate ? undefined : 'text-muted'}>
          {t('dashboard.settings.fields.sponsor_sidebar_interval_seconds.label', { value: formatNumber(Number.isFinite(interval) ? interval : SIDEBAR_INTERVAL_MIN) })}
        </Form.Label>
        <Form.Range
          min={SIDEBAR_INTERVAL_MIN}
          max={SIDEBAR_INTERVAL_MAX}
          value={Number.isFinite(interval) ? interval : SIDEBAR_INTERVAL_MIN}
          disabled={disabled || !rotate}
          aria-describedby="setting-sponsor_sidebar_interval_seconds-help"
          onChange={(event) => onChange('sponsor_sidebar_interval_seconds')(event.target.value)}
        />
        {errors.sponsor_sidebar_interval_seconds && <div className="text-danger small">{errors.sponsor_sidebar_interval_seconds}</div>}
        <Form.Text id="setting-sponsor_sidebar_interval_seconds-help" className="text-muted">
          {rotate ? t('dashboard.settings.fields.sponsor_sidebar_interval_seconds.help', { min: SIDEBAR_INTERVAL_MIN, max: SIDEBAR_INTERVAL_MAX }) : t('dashboard.settings.sidebarRotateOff')}
        </Form.Text>
      </Form.Group>
    </div>
  )
}
