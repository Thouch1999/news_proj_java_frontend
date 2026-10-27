import { Card, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { PROMO_LANGUAGES, WEIGHT_MAX, WEIGHT_MIN } from '../../constants/promo'
import { useFormat } from '../../hooks/useFormat'

// The side column of the sponsor form: the on/off switch, the dates, the weight, the language and the categories.
// `form` and `errors` are the state of the page; `onChange(field, value)` changes one field.
export function PublishingCard({ form, errors, disabled, onChange }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  return (
    <Card>
      <Card.Header className="bg-surface">
        <h2 className="h6 mb-0">{t('dashboard.partners.form.settings')}</h2>
      </Card.Header>
      <Card.Body>
        <Form.Group className="mb-3" controlId="partner-active">
          <Form.Check type="switch" label={t('dashboard.partners.form.active')} checked={form.active} disabled={disabled} onChange={(event) => onChange('active', event.target.checked)} aria-describedby="partner-active-help" />
          <Form.Text id="partner-active-help" className="text-muted">
            {t('dashboard.partners.form.activeHelp')}
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="partner-start">
          <Form.Label>{t('dashboard.partners.form.start')}</Form.Label>
          <Form.Control type="datetime-local" value={form.startAt} max={form.endAt || undefined} disabled={disabled} onChange={(event) => onChange('startAt', event.target.value)} />
        </Form.Group>
        <Form.Group className="mb-1" controlId="partner-end">
          <Form.Label>{t('dashboard.partners.form.end')}</Form.Label>
          <Form.Control type="datetime-local" value={form.endAt} min={form.startAt || undefined} disabled={disabled} isInvalid={Boolean(errors.endAt)} aria-describedby="partner-time-help" onChange={(event) => onChange('endAt', event.target.value)} />
          <Form.Control.Feedback type="invalid">{errors.endAt}</Form.Control.Feedback>
        </Form.Group>
        <Form.Text id="partner-time-help" className="text-muted d-block mb-3">
          {t('dashboard.partners.form.timeHelp')}
        </Form.Text>

        <Form.Group className="mb-3" controlId="partner-weight">
          <div className="d-flex justify-content-between">
            <Form.Label>{t('dashboard.partners.form.weight')}</Form.Label>
            <span className="fw-semibold" aria-hidden="true">
              {formatNumber(form.weight)}
            </span>
          </div>
          <Form.Range min={WEIGHT_MIN} max={WEIGHT_MAX} value={form.weight} disabled={disabled} aria-describedby="partner-weight-help" onChange={(event) => onChange('weight', Number(event.target.value))} />
          {errors.weight && <div className="text-danger small">{errors.weight}</div>}
          <Form.Text id="partner-weight-help" className="text-muted">
            {t('dashboard.partners.form.weightHelp')}
          </Form.Text>
        </Form.Group>

        <Form.Group controlId="partner-language">
          <Form.Label>{t('dashboard.partners.form.language')}</Form.Label>
          <Form.Select value={form.language} disabled={disabled} aria-describedby="partner-language-help" onChange={(event) => onChange('language', event.target.value)}>
            {PROMO_LANGUAGES.map((language) => (
              <option key={language} value={language} lang={language === 'KM' ? 'km' : undefined}>
                {t(`dashboard.partners.form.languages.${language}`)}
              </option>
            ))}
          </Form.Select>
          <Form.Text id="partner-language-help" className="text-muted">
            {t('dashboard.partners.form.languageHelp')}
          </Form.Text>
        </Form.Group>
      </Card.Body>
    </Card>
  )
}

// Optional targeting: none chosen means every category.
export function CategoriesCard({ categories, selected, disabled, error, onChange }) {
  const { t } = useTranslation()
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])
  return (
    <Card>
      <Card.Header className="bg-surface">
        <h2 className="h6 mb-0">{t('dashboard.partners.form.categories')}</h2>
      </Card.Header>
      <Card.Body>
        <div className="small fw-semibold mb-2" aria-live="polite">
          {selected.length === 0 ? t('dashboard.partners.form.allCategories') : categories.filter((category) => selected.includes(category.id)).map((category) => category.name).join(', ')}
        </div>
        {categories.length === 0 ? (
          <p className="text-muted small mb-0">{t('dashboard.partners.form.noCategories')}</p>
        ) : (
          <div className="partner-category-list" role="group" aria-label={t('dashboard.partners.form.categories')}>
            {categories.map((category) => (
              <Form.Check key={category.id} type="checkbox" id={`partner-category-${category.id}`} label={category.name} checked={selected.includes(category.id)} disabled={disabled} onChange={() => toggle(category.id)} />
            ))}
          </div>
        )}
        {error && <div className="text-danger small mt-2">{error}</div>}
        <Form.Text className="text-muted d-block mt-2">{t('dashboard.partners.form.categoriesHelp')}</Form.Text>
      </Card.Body>
    </Card>
  )
}
