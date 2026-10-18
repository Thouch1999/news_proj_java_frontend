import { useState } from 'react'
import { Button, Form, Spinner } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/common/AuthPage'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import { RESEND_COOLDOWN_SECONDS } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import * as authService from '../../services/authService'
import { rules } from '../../utils/validators'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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
      navigate(ROUTES.RESET_PASSWORD, {
        state: { email: normalized, noticeKey: 'auth.notices.forgotPassword', cooldown: RESEND_COOLDOWN_SECONDS },
      })
    } catch (caught) {
      setApiError(caught)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPage title={t('auth.forgot.title')} description={t('auth.forgot.intro')} secondary={<Trans i18nKey="auth.secondary.remembered" components={{ 1: <Link to={ROUTES.LOGIN} /> }} />}>
      <Form onSubmit={handleSubmit} noValidate>
        <ErrorAlert error={apiError} />
        <FormField id="email" label={t('auth.fields.email')} type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={error} autoComplete="email" autoFocus />
        <Button type="submit" className="w-100" disabled={submitting}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('auth.forgot.sending') : t('auth.forgot.send')}
        </Button>
      </Form>
    </AuthPage>
  )
}
