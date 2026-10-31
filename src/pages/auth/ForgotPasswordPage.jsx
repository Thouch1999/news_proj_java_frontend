import { useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/common/AuthPage'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import { OTP_PURPOSE } from '../../constants/otp'
import { useRetryAfter } from '../../hooks/useRetryAfter'
import { ROUTES } from '../../constants/routes'
import * as authService from '../../services/authService'
import { savePending } from '../../utils/pendingVerification'
import { rules } from '../../utils/validators'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const retry = useRetryAfter(apiError)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = rules.email(email)
    setError(found)
    setApiError(null)
    if (found) {
      return
    }
    setSubmitting(true)
    try {
      const normalized = email.trim().toLowerCase()
      await authService.forgotPassword({ email: normalized })
      savePending({ purpose: OTP_PURPOSE.RESET_PASSWORD, email: normalized })
      navigate(ROUTES.RESET_PASSWORD, { state: { noticeKey: 'auth.notices.forgotPassword' } })
    } catch (caught) {
      setApiError(caught)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPage
      title={t('auth.forgot.title')}
      description={t('auth.forgot.intro')}
      notice={state?.message && <Alert variant={state.variant ?? 'info'}>{state.message}</Alert>}
      secondary={<Trans i18nKey="auth.secondary.remembered" components={{ 1: <Link to={ROUTES.LOGIN} /> }} />}>
      <Form onSubmit={handleSubmit} noValidate>
        <ErrorAlert error={apiError} />
        <FormField id="email" label={t('auth.fields.email')} type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={error} autoComplete="email" autoFocus />
        <Button type="submit" className="w-100" disabled={submitting || retry > 0}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('auth.forgot.sending') : t('auth.forgot.send')}
        </Button>
      </Form>
    </AuthPage>
  )
}
