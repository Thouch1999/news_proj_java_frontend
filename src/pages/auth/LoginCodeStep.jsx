import { useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import AuthPage from '../../components/common/AuthPage'
import ErrorAlert from '../../components/common/ErrorAlert'
import OtpInput from '../../components/form/OtpInput'
import OtpResendArea from '../../components/form/OtpResendArea'
import PendingGate from '../../components/form/PendingGate'
import { OTP_LENGTH, OTP_PURPOSE } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { usePendingVerification } from '../../hooks/usePendingVerification'
import { useRetryAfter } from '../../hooks/useRetryAfter'
import * as authService from '../../services/authService'
import { postLoginPath } from '../../utils/postLoginPath'
import { rules } from '../../utils/validators'

// The code step of a staff login (route /login/verify). `password` is what the login form still holds in memory; it is
// never stored. After a refresh it is empty: the backend has no resend for a login code (a new one is sent by logging in
// again), so "Send a new code" then goes back to the login form with the email filled in and asks for the password.
export default function LoginCodeStep({ password, from }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const step = usePendingVerification({
    purpose: OTP_PURPOSE.LOGIN,
    startPath: ROUTES.LOGIN,
    send: (email) => authService.login({ email, password }),
  })

  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // too many failed attempts: the buttons wait for the countdown of the error
  const retry = useRetryAfter(apiError)
  const blocked = retry > 0

  if (step.gate) {
    return <PendingGate gate={step.gate} />
  }
  const { pending } = step

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = { otp: rules.otp(otp) }
    setErrors(found)
    setApiError(null)
    step.setNotice(null)
    if (found.otp) {
      return
    }
    setSubmitting(true)
    try {
      const result = await authService.verifyLoginOtp({ email: pending.email, otp })
      step.clear()
      setSession(result)
      navigate(postLoginPath(result.user, from), { replace: true })
    } catch (error) {
      setApiError(error)
      setOtp('')
      setSubmitting(false)
    }
  }

  const backToLogin = (state) => {
    step.clear()
    navigate(ROUTES.LOGIN, { state })
  }

  const handleResend = async () => {
    setApiError(null)
    if (!password) {
      backToLogin({ email: pending.email, message: t('auth.pending.passwordForCode'), variant: 'info' })
      return
    }
    const error = await step.resend()
    if (error) {
      setApiError(error)
    } else {
      setOtp('')
      setErrors({})
    }
  }

  return (
    <AuthPage
      title={t('auth.login.otpTitle')}
      description={t('auth.otp.sentTo', { length: OTP_LENGTH, email: pending.maskedEmail })}
      secondary={<Trans i18nKey="auth.otp.notYou" components={{ 1: <Button variant="link" type="button" className="p-0 align-baseline" onClick={() => backToLogin(null)} /> }} />}
    >
      <Form onSubmit={handleSubmit} noValidate>
        <ErrorAlert error={apiError} />
        {step.notice && <Alert variant="info">{step.notice}</Alert>}
        <OtpInput value={otp} onChange={setOtp} invalid={Boolean(errors.otp)} describedBy="otp-error" disabled={submitting || step.expired} autoFocus focusSignal={step.focusSignal} />
        {errors.otp && (
          <div id="otp-error" className="text-danger text-center small mb-2">
            {errors.otp}
          </div>
        )}
        <Button type="submit" className="w-100" disabled={submitting || step.expired || blocked}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('auth.login.verifying') : t('auth.otp.verify')}
        </Button>
        <OtpResendArea expired={step.expired} remaining={step.resendRemaining} onResend={handleResend} disabled={step.sending || blocked} />
      </Form>
    </AuthPage>
  )
}
