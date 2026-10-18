import { Alert, Button, Form, InputGroup } from 'react-bootstrap'
import { ExclamationTriangle } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { contrast, HEX_COLOR, onColor } from '../../utils/color'

const LIGHT_PAGE = '#FFFFFF'
const DARK_PAGE = '#252B3B'

// A colour setting: a colour picker and a hex input that follow each other, the contrast of the colour and a warning when
// it would be hard to read. The site makes its text readable on the colour (white or dark text on it) and moves the colour
// itself where it is used as text (links, icons), so the warning is about how much the colour has to be changed.
export default function ColorField({ id, label, value, onChange, error, defaultValue }) {
  const { t } = useTranslation()
  const valid = HEX_COLOR.test(value)
  const onLight = valid ? contrast(value, LIGHT_PAGE) : 0
  const onDark = valid ? contrast(value, DARK_PAGE) : 0
  const textOn = valid ? onColor(value) : null
  const weak = valid && (onLight < 4.5 || onDark < 4.5)

  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label>{label}</Form.Label>
      <InputGroup hasValidation>
        <Form.Control
          type="color"
          className="form-control-color flex-grow-0"
          style={{ width: '3.5rem' }}
          value={valid ? value.toLowerCase() : '#000000'}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label={t('dashboard.settings.color.picker', { name: label })}
        />
        <Form.Control
          type="text"
          id={`${id}-hex`}
          value={value}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value.trim())}
          isInvalid={Boolean(error)}
          aria-label={t('dashboard.settings.color.hex', { name: label })}
          aria-describedby={`${id}-contrast`}
        />
        {defaultValue && value.toUpperCase() !== defaultValue && (
          <Button variant="outline-secondary" onClick={() => onChange(defaultValue)}>
            {t('dashboard.settings.color.useDefault')}
          </Button>
        )}
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </InputGroup>
      {valid && (
        <div id={`${id}-contrast`} className="small text-muted mt-2">
          <span className="d-inline-block rounded px-2 me-2" style={{ background: value, color: textOn }}>
            {textOn === '#FFFFFF' ? t('dashboard.settings.color.whiteText') : t('dashboard.settings.color.darkText')}
          </span>
          {t('dashboard.settings.color.ratios', { light: onLight.toFixed(1), dark: onDark.toFixed(1) })}
        </div>
      )}
      {weak && (
        <Alert variant="warning" className="small py-2 mt-2 mb-0 d-flex gap-2">
          <ExclamationTriangle className="flex-shrink-0 mt-1" aria-hidden="true" />
          <span>{t('dashboard.settings.color.lowContrast', { light: onLight.toFixed(1), dark: onDark.toFixed(1) })}</span>
        </Alert>
      )}
    </Form.Group>
  )
}
