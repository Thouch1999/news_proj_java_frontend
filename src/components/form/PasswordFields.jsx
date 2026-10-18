import { useEffect, useState } from 'react'
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap'
import { Circle, CheckCircleFill, Clipboard, Eye, EyeSlash, Stars } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import { generatePassword, PASSWORD_MIN, passwordStrength } from '../../utils/password'

// Password and Confirm password with everything around them: an eye to show the text, "Generate strong password" and
// "Copy", a strength meter, the backend's rule ticked while typing and "Passwords match / do not match".
//   value: { password, confirm }   onChange(value)   errors: { password, confirm } shown under the fields
//   onBlur(field) tells the page a field was left   onCopied() lets the page show its own toast
//   labels: { password, confirm } replaces the field labels   generator={false} hides "Generate" and "Copy"
//   compact: a thin strength bar, and the rule on one small line only while the password field has the focus (or an
//   error)   columns: the two fields side by side from 576px up (with compact)
// Used by the Add user page, the reset password dialog and the profile page.
export default function PasswordFields({ idPrefix = 'password', value, errors = {}, labels, generator = true, compact = false, columns = false, onChange, onBlur, onCopied }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState({ password: false, confirm: false })
  const [copied, setCopied] = useState(false)
  const [focused, setFocused] = useState(false)
  const { password, confirm } = value
  const strength = passwordStrength(password)

  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const generate = () => {
    const generated = generatePassword()
    onChange({ password: generated, confirm: generated })
    setVisible({ password: true, confirm: true })
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      onCopied?.()
    } catch {
      // the browser did not allow it: the text is visible after "show", so it can still be copied by hand
    }
  }
  const toggle = (field) => setVisible((current) => ({ ...current, [field]: !current[field] }))

  const field = (name, label, autoFocus) => (
    <Form.Group className="mb-3" controlId={`${idPrefix}-${name}`}>
      <Form.Label>{label}</Form.Label>
      <InputGroup hasValidation>
        <Form.Control
          type={visible[name] ? 'text' : 'password'}
          value={value[name]}
          isInvalid={Boolean(errors[name])}
          aria-invalid={errors[name] ? true : undefined}
          aria-describedby={errors[name] ? `${idPrefix}-${name}-error` : undefined}
          autoComplete="new-password"
          autoFocus={autoFocus}
          onChange={(event) => onChange({ ...value, [name]: event.target.value })}
          onFocus={() => name === 'password' && setFocused(true)}
          onBlur={() => {
            if (name === 'password') setFocused(false)
            onBlur?.(name)
          }}
        />
        <Button type="button" variant="outline-secondary" aria-label={visible[name] ? t('users.password.hide') : t('users.password.show')} aria-pressed={visible[name]} onClick={() => toggle(name)}>
          {visible[name] ? <EyeSlash aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
        <Form.Control.Feedback type="invalid" id={`${idPrefix}-${name}-error`}>
          {errors[name]}
        </Form.Control.Feedback>
      </InputGroup>
    </Form.Group>
  )

  const ruleItem = (
    <li className={password.length >= PASSWORD_MIN ? 'is-done' : undefined}>
      {password.length >= PASSWORD_MIN ? <CheckCircleFill aria-hidden="true" /> : <Circle aria-hidden="true" />} {t('users.password.ruleMin', { min: PASSWORD_MIN })}
    </li>
  )
  const meter = (
    <div className={compact ? 'password-meter password-meter--thin' : 'mb-3'} aria-live="polite">
      <div className={`strength${compact ? ' strength--thin' : ''}`} data-level={strength} aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={`strength__bar${strength >= step ? ' is-on' : ''}`} />
        ))}
      </div>
      <div className={compact ? 'small text-muted' : 'small text-muted mt-1'}>{t('users.password.strength', { level: t(`users.password.level.${strength}`) })}</div>
    </div>
  )
  const match =
    password && confirm ? (
      <div className={`small mb-2 ${password === confirm ? 'match-ok' : 'match-bad'}`} role="status">
        {password === confirm ? t('users.password.match') : t('users.password.noMatch')}
      </div>
    ) : null

  if (compact) {
    const showRule = focused || Boolean(errors.password)
    const hint = (password || showRule) && (
      <div className="password-hint">
        {password && meter}
        {showRule && <ul className="list-unstyled small mb-0 password-rules password-rules--inline">{ruleItem}</ul>}
      </div>
    )
    return (
      <div>
        {columns ? (
          <Row className="gx-3">
            <Col sm={6}>{field('password', labels?.password ?? t('users.fields.password'), false)}</Col>
            <Col sm={6}>{field('confirm', labels?.confirm ?? t('users.fields.confirmPassword'))}</Col>
          </Row>
        ) : (
          <>
            {field('password', labels?.password ?? t('users.fields.password'), false)}
            {field('confirm', labels?.confirm ?? t('users.fields.confirmPassword'))}
          </>
        )}
        {hint}
        {match}
      </div>
    )
  }

  return (
    <div>
      {generator && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <Button type="button" variant="outline-primary" size="sm" onClick={generate}>
            <Stars className="me-1" aria-hidden="true" />
            {t('users.password.generate')}
          </Button>
          <Button type="button" variant="outline-secondary" size="sm" disabled={!password} onClick={copy}>
            <Clipboard className="me-1" aria-hidden="true" />
            {copied ? t('users.password.copied') : t('users.password.copy')}
          </Button>
        </div>
      )}

      {field('password', labels?.password ?? t('users.fields.password'), false)}
      {password && meter}
      <ul className="list-unstyled small mb-3 password-rules">{ruleItem}</ul>

      {field('confirm', labels?.confirm ?? t('users.fields.confirmPassword'))}
      {match}
    </div>
  )
}
