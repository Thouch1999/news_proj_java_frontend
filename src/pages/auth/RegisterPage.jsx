import { useState } from 'react'
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/common/AuthPage'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import HoneypotField from '../../components/form/HoneypotField'
import PasswordFields from '../../components/form/PasswordFields'
import { OTP_PURPOSE } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import { useRetryAfter } from '../../hooks/useRetryAfter'
import { useSettings } from '../../hooks/useSettings'
import * as authService from '../../services/authService'
import { savePending } from '../../utils/pendingVerification'
import { blankToNull, hasErrors, rules } from '../../utils/validators'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', fullName: '', password: '', confirm: '', website: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const retry = useRetryAfter(apiError)

  const { siteName } = useSettings()
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = {
      username: rules.username(form.username),
      email: rules.email(form.email),
      fullName: rules.fullName(form.fullName),
      password: rules.password(form.password),
      confirm: rules.confirm(form.password, form.confirm),
    }
    setErrors(found)
    setApiError(null)
    if (hasErrors(found)) {
      return
    }

    setSubmitting(true)
    try {
      const email = form.email.trim().toLowerCase()
      await authService.register({
        username: form.username.trim(),
        email,
        fullName: blankToNull(form.fullName),
        password: form.password,
        confirm: form.confirm,
        website: form.website, // the honeypot: empty for a person
      })
      // a verification code was just emailed: the pending verification (with its countdowns) survives a refresh
      savePending({ purpose: OTP_PURPOSE.REGISTER, email })
      navigate(ROUTES.VERIFY_EMAIL)
    } catch (error) {
      setApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPage
      wide
      title={t('auth.register.title')}
      description={t('auth.register.description', { site: siteName })}
      notice={state?.message && <Alert variant={state.variant ?? 'info'}>{state.message}</Alert>}
      secondary={<Trans i18nKey="auth.register.haveAccount" components={{ 1: <Link to={ROUTES.LOGIN} /> }} />}
    >
      <Form onSubmit={handleSubmit} noValidate>
        <ErrorAlert error={apiError} />
        <Row className="gx-3">
          <Col sm={6}>
            <FormField id="username" label={t('auth.fields.username')} value={form.username} onChange={update('username')} error={errors.username} autoComplete="username" autoFocus />
          </Col>
          <Col sm={6}>
            <FormField id="fullName" label={t('auth.fields.fullName')} optional value={form.fullName} onChange={update('fullName')} error={errors.fullName} autoComplete="name" />
          </Col>
        </Row>
        <FormField id="email" label={t('auth.fields.email')} type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="email" />
        <PasswordFields
          idPrefix="register"
          generator={false}
          compact
          columns
          value={{ password: form.password, confirm: form.confirm }}
          errors={errors}
          labels={{ password: t('auth.fields.password'), confirm: t('auth.fields.confirmPassword') }}
          onChange={(value) => setForm((current) => ({ ...current, ...value }))}
        />
        <HoneypotField id="register-website" value={form.website} onChange={(website) => setForm((current) => ({ ...current, website }))} />
        <Button type="submit" className="w-100" disabled={submitting || retry > 0}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('auth.register.creating') : t('auth.register.submit')}
        </Button>
      </Form>
    </AuthPage>
  )
}
