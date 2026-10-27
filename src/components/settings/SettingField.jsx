import { Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { SETTING_RULES } from '../../constants/siteSettings'

// One text setting: a label, an input (or a textarea for a multi-line value), a character counter for the long ones, a
// help text and the problem under it (from the form check or from the backend). `lang` marks Khmer text for the browser.
export default function SettingField({ id, label, help, value, onChange, error, settingKey, type = 'text', lang, disabled = false }) {
  const { t } = useTranslation()
  const rule = SETTING_RULES[settingKey] ?? {}
  const multiline = Boolean(rule.multiline)
  const describedBy = [help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        as={multiline ? 'textarea' : 'input'}
        rows={multiline ? (rule.rows ?? 3) : undefined}
        spellCheck={rule.lines ? false : undefined}
        type={multiline ? undefined : type}
        lang={lang}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        isInvalid={Boolean(error)}
        disabled={disabled}
        aria-describedby={describedBy}
      />
      <Form.Control.Feedback type="invalid" id={`${id}-error`}>
        {error}
      </Form.Control.Feedback>
      <div className="d-flex justify-content-between gap-2">
        {help ? (
          <Form.Text id={`${id}-help`} className="text-muted">
            {help}
          </Form.Text>
        ) : (
          <span />
        )}
        {multiline && rule.max && (
          <Form.Text className="text-muted text-nowrap" aria-hidden="true">
            {rule.lines && `${t('dashboard.settings.linesCount', { count: value.split(/\r?\n/).filter((line) => line.trim()).length })} · `}
            {value.length}/{rule.max}
          </Form.Text>
        )}
      </div>
    </Form.Group>
  )
}
