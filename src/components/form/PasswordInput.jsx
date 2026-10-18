import { useState } from 'react'
import { Button, Form, InputGroup } from 'react-bootstrap'
import { Eye, EyeSlash, ExclamationTriangleFill } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'

// A single password field with an eye to show the text and the error under it (the same look as PasswordFields).
//   labelAction: something at the right end of the label line (the "Forgot password?" link)
//   warnCapsLock: says "Caps Lock is on" while the key is on and the field has the focus
//   inputRef / autoFocus: for the page to focus the field
export default function PasswordInput({ id, label, value, error, autoComplete = 'current-password', labelAction, warnCapsLock = false, autoFocus = false, inputRef, onChange }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const describedBy = [error && `${id}-error`, capsLock && `${id}-caps`].filter(Boolean).join(' ')

  const watchCaps = (event) => {
    if (warnCapsLock && event.getModifierState) setCapsLock(event.getModifierState('CapsLock'))
  }

  return (
    <Form.Group className="mb-3" controlId={id}>
      <div className="d-flex justify-content-between align-items-baseline gap-2">
        <Form.Label>{label}</Form.Label>
        {labelAction}
      </div>
      <InputGroup hasValidation>
        <Form.Control
          ref={inputRef}
          type={visible ? 'text' : 'password'}
          value={value}
          isInvalid={Boolean(error)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={watchCaps}
          onKeyUp={watchCaps}
          onBlur={() => setCapsLock(false)}
        />
        <Button type="button" variant="outline-secondary" aria-label={visible ? t('users.password.hide') : t('users.password.show')} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
          {visible ? <EyeSlash aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
        <Form.Control.Feedback type="invalid" id={`${id}-error`}>
          {error}
        </Form.Control.Feedback>
      </InputGroup>
      {capsLock && (
        <div id={`${id}-caps`} className="auth-caps small mt-1" role="status">
          <ExclamationTriangleFill aria-hidden="true" className="me-1" />
          {t('auth.capsLock')}
        </div>
      )}
    </Form.Group>
  )
}
