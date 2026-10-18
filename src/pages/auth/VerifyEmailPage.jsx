import { useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/common/AuthPage'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import OtpInput from '../../components/form/OtpInput'
import ResendButton from '../../components/form/ResendButton'
import { OTP_LENGTH, OTP_PURPOSE, RESEND_COOLDOWN_SECONDS } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useCountdown } from '../../hooks/useCountdown'
import * as authService from '../../services/authService'
import { rules } from '../../utils/validators'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, refreshUser } = useAuth()
  const countdown = useCountdown()

  const [email, setEmail] = useState(state?.email ?? '')
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // arriving from registration: the code was sent a moment ago, so only start the countdown once
  const [started, setStarted] = useState(false)
  if (state?.justSent && !started) {
    setStarted(true)
    countdown.start(RESEND_COOLDOWN_SECONDS)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = { email: rules.email(email), otp: rules.otp(otp) }
    setErrors(found)
    setApiError(null)
    setNotice(null)
    if (found.email || found.otp) {
      return
    }

    setSubmitting(true)
    try {
      await authService.verifyEmail({ email: email.trim().toLowerCase(), otp })
      if (isAuthenticated) {
        await refreshUser()
        navigate(ROUTES.PROFILE, { replace: true })
      } else {
        navigate(ROUTES.LOGIN, {
          replace: true,
          state: { message: t('auth.verify.success'), variant: 'success' },
        })
      }
    } catch (error) {
      setApiError(error)
      setOtp('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    const emailError = rules.email(email)
    setErrors({ email: emailError })
    setApiError(null)
    setNotice(null)
    if (emailError) {
      return
    }
    try {
      await authService.resendOtp({ email: email.trim().toLowerCase(), purpose: OTP_PURPOSE.REGISTER })
      setNotice('auth.notices.verifyResent')
      countdown.start(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      setApiError(error)
    }
  }

  return (
    <AuthPage
      title={t('auth.verify.title')}
      description={t('auth.verify.intro', { length: OTP_LENGTH })}
      secondary={<Trans i18nKey="auth.verify.secondary" components={{ 1: <Link to={ROUTES.LOGIN} /> }} />}
    >
      <Form onSubmit={handleSubmit} noValidate>
        <ErrorAlert error={apiError} />
        {notice && <Alert variant="info">{t(notice)}</Alert>}
        {!state?.email && <FormField id="email" label={t('auth.fields.email')} type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} autoComplete="email" autoFocus />}
        {state?.email && <p className="text-center fw-semibold text-break">{email}</p>}
        <OtpInput value={otp} onChange={setOtp} invalid={Boolean(errors.otp)} describedBy="otp-error" disabled={submitting} autoFocus={Boolean(state?.email)} />
        {errors.otp && (
          <div id="otp-error" className="text-danger text-center small mb-2">
            {errors.otp}
          </div>
        )}
        <Button type="submit" className="w-100" disabled={submitting}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('auth.verify.verifying') : t('auth.verify.submit')}
        </Button>
        <div className="text-center mt-2">
          <ResendButton remaining={countdown.remaining} onClick={handleResend} />
        </div>
      </Form>
    </AuthPage>
  )
}
