import { Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

// Labelled input with an inline error. Extra props go to the input (type, value, onChange, ...).
// `optional` puts a muted "Optional" next to the label. The error and the help text are linked to the input
// (aria-describedby) and an invalid input says so (aria-invalid), so a screen reader reads them with the field.
export default function FormField({ id, label, error, help, optional = false, ...inputProps }) {
  const { t } = useTranslation()
  const describedBy = [error && `${id}-error`, help && `${id}-help`].filter(Boolean).join(' ')
  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label>
        {label}
        {optional && <span className="text-muted fw-normal small ms-2">{t('common.optional')}</span>}
      </Form.Label>
      <Form.Control isInvalid={Boolean(error)} aria-invalid={error ? true : undefined} aria-describedby={describedBy || undefined} {...inputProps} />
      <Form.Control.Feedback type="invalid" id={`${id}-error`}>
        {error}
      </Form.Control.Feedback>
      {help && (
        <Form.Text className="text-muted" id={`${id}-help`}>
          {help}
        </Form.Text>
      )}
    </Form.Group>
  )
}
