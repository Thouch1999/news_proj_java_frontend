import { Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { POPUP_FREQUENCIES, POPUP_TRIGGERS } from '../../constants/promo'
import { useFormat } from '../../hooks/useFormat'

// "Popup timing" of the popup place: use the site default (shown as a sentence) or the sponsor's own rules. The limits come from
// the backend options (the same numbers the backend enforces) and are shown as hints under the controls.
//   form: { popupUseDefaults, popupTrigger, popupDelaySeconds, popupScrollPercent, popupFrequency, popupFrequencyDays }
//   options: { popupDefaults, limits }   errors: the field errors of the form   onChange(field, value)

// "after 15 seconds or 50% scrolled, whichever comes first; once per day" for a set of rules ({ trigger, delaySeconds, ... })
function useSummary() {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  return (rules) => {
    const when = t(`dashboard.partners.timing.summary.${rules.trigger}`, { delay: formatNumber(rules.delaySeconds), scroll: formatNumber(rules.scrollPercent) })
    const often = t(`dashboard.partners.timing.summary.${rules.frequency}`, { days: formatNumber(rules.frequencyDays) })
    return `${when}; ${often}`
  }
}

export default function PartnerTimingFields({ form, errors, options, disabled, onChange }) {
  const { t } = useTranslation()
  const { formatNumber } = useFormat()
  const summary = useSummary()
  const { limits, popupDefaults } = options
  const own = !form.popupUseDefaults
  const delayUsed = form.popupTrigger !== 'SCROLL'
  const scrollUsed = form.popupTrigger !== 'DELAY'
  const daysUsed = form.popupFrequency === 'EVERY_N_DAYS'

  const radio = (name, value, id, checked, onSelect, label) => (
    <Form.Check key={value} type="radio" id={id} name={name} label={label} checked={checked} disabled={disabled} onChange={onSelect} className="partner-timing__option" />
  )

  return (
    <div className="partner-timing mt-4" id="partner-timing">
      <div className="fw-semibold" id="partner-timing-title">
        {t('dashboard.partners.timing.title')}
      </div>
      <Form.Check
        type="switch"
        id="partner-popup-defaults"
        className="mt-2"
        label={t('dashboard.partners.timing.useDefault')}
        checked={form.popupUseDefaults}
        disabled={disabled}
        aria-describedby="partner-popup-defaults-help"
        onChange={(event) => onChange('popupUseDefaults', event.target.checked)}
      />
      <Form.Text id="partner-popup-defaults-help" className="text-muted d-block">
        {t('dashboard.partners.timing.defaultsAre', { rules: summary(popupDefaults) })}
      </Form.Text>

      {own && (
        <div className="mt-3">
          <fieldset className="mb-3" aria-describedby={errors.popupTrigger ? 'partner-popup-trigger-error' : undefined}>
            <legend className="fs-6 fw-semibold mb-1">{t('dashboard.partners.timing.when')}</legend>
            {POPUP_TRIGGERS.map((trigger) =>
              radio('partner-popup-trigger', trigger, trigger === POPUP_TRIGGERS[0] ? 'partner-popup-trigger' : `partner-popup-trigger-${trigger}`, form.popupTrigger === trigger, () => onChange('popupTrigger', trigger), t(`dashboard.partners.timing.triggers.${trigger}`)),
            )}
            {errors.popupTrigger && (
              <div id="partner-popup-trigger-error" className="text-danger small" role="alert">
                {errors.popupTrigger}
              </div>
            )}
          </fieldset>

          <Form.Group className="mb-3" controlId="partner-popup-delay">
            <div className="d-flex justify-content-between">
              <Form.Label className={delayUsed ? undefined : 'text-muted'}>{t('dashboard.partners.timing.delay', { value: formatNumber(form.popupDelaySeconds) })}</Form.Label>
            </div>
            <Form.Range min={limits.popupDelayMin} max={limits.popupDelayMax} value={form.popupDelaySeconds} disabled={disabled || !delayUsed} aria-describedby="partner-popup-delay-help" onChange={(event) => onChange('popupDelaySeconds', Number(event.target.value))} />
            {errors.popupDelaySeconds && <div className="text-danger small">{errors.popupDelaySeconds}</div>}
            <Form.Text id="partner-popup-delay-help" className="text-muted">
              {delayUsed ? t('dashboard.partners.timing.delayHint', { min: limits.popupDelayMin, max: limits.popupDelayMax }) : t('dashboard.partners.timing.notUsed')}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="partner-popup-scroll">
            <div className="d-flex justify-content-between">
              <Form.Label className={scrollUsed ? undefined : 'text-muted'}>{t('dashboard.partners.timing.scroll', { value: formatNumber(form.popupScrollPercent) })}</Form.Label>
            </div>
            <Form.Range min={limits.popupScrollMin} max={limits.popupScrollMax} value={form.popupScrollPercent} disabled={disabled || !scrollUsed} aria-describedby="partner-popup-scroll-help" onChange={(event) => onChange('popupScrollPercent', Number(event.target.value))} />
            {errors.popupScrollPercent && <div className="text-danger small">{errors.popupScrollPercent}</div>}
            <Form.Text id="partner-popup-scroll-help" className="text-muted">
              {scrollUsed ? t('dashboard.partners.timing.scrollHint', { min: limits.popupScrollMin, max: limits.popupScrollMax }) : t('dashboard.partners.timing.notUsed')}
            </Form.Text>
          </Form.Group>

          <fieldset className="mb-2" aria-describedby={errors.popupFrequency ? 'partner-popup-frequency-error' : undefined}>
            <legend className="fs-6 fw-semibold mb-1">{t('dashboard.partners.timing.how')}</legend>
            {POPUP_FREQUENCIES.map((frequency) => {
              const id = frequency === POPUP_FREQUENCIES[0] ? 'partner-popup-frequency' : `partner-popup-frequency-${frequency}`
              if (frequency !== 'EVERY_N_DAYS') {
                return radio('partner-popup-frequency', frequency, id, form.popupFrequency === frequency, () => onChange('popupFrequency', frequency), t(`dashboard.partners.timing.frequencies.${frequency}`))
              }
              // "Once every [ 3 ] days": the number sits in the label of its radio
              return (
                <div key={frequency} className="d-flex flex-wrap align-items-center gap-2 partner-timing__option">
                  <Form.Check type="radio" id={id} name="partner-popup-frequency" label={t('dashboard.partners.timing.everyBefore')} checked={daysUsed} disabled={disabled} onChange={() => onChange('popupFrequency', frequency)} className="mb-0" />
                  <Form.Control
                    id="partner-popup-days"
                    type="number"
                    inputMode="numeric"
                    size="sm"
                    className="partner-timing__days"
                    min={limits.popupFrequencyDaysMin}
                    max={limits.popupFrequencyDaysMax}
                    value={form.popupFrequencyDays}
                    disabled={disabled || !daysUsed}
                    isInvalid={Boolean(errors.popupFrequencyDays)}
                    aria-label={t('dashboard.partners.timing.daysLabel')}
                    aria-describedby="partner-popup-days-help"
                    onChange={(event) => onChange('popupFrequencyDays', event.target.value === '' ? '' : Number(event.target.value))}
                  />
                  <span>{t('dashboard.partners.timing.everyAfter')}</span>
                </div>
              )
            })}
            {errors.popupFrequency && (
              <div id="partner-popup-frequency-error" className="text-danger small" role="alert">
                {errors.popupFrequency}
              </div>
            )}
            {errors.popupFrequencyDays && <div className="text-danger small">{errors.popupFrequencyDays}</div>}
            <Form.Text id="partner-popup-days-help" className="text-muted d-block">
              {t('dashboard.partners.timing.daysHint', { min: limits.popupFrequencyDaysMin, max: limits.popupFrequencyDaysMax })}
            </Form.Text>
          </fieldset>
          <p className="text-muted small mb-0">{t('dashboard.partners.timing.limitsNote', { min: limits.popupDelayMin })}</p>
        </div>
      )}
    </div>
  )
}
