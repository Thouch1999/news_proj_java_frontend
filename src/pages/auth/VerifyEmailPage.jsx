import { useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
import { rules } from '../../utils/validators'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, refreshUser } = useAuth()
  const step = usePendingVerification({
    purpose: OTP_PURPOSE.REGISTER,
    startPath: ROUTES.REGISTER,
    linkEmail: state?.email,
    send: (email) => authService.resendOtp({ email, purpose: OTP_PURPOSE.REGISTER }),
  })

  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const retry = useRetryAfter(apiError)

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
      await authService.verifyEmail({ email: pending.email, otp })
      step.clear()
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
    setApiError(null)
    const error = await step.resend()
    if (error) {
      setApiError(error)
    } else {
      setOtp('')
      setErrors({})
    }
  }

  const startAgain = () => {
    step.clear()
    navigate(ROUTES.REGISTER)
  }

  return (
    <AuthPage
      title={t('auth.verify.title')}
      description={t('auth.otp.sentTo', { length: OTP_LENGTH, email: pending.maskedEmail })}
      secondary={<Trans i18nKey="auth.verify.secondary" components={{ 1: <Link to={ROUTES.LOGIN} onClick={step.clear} /> }} />}
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
        <Button type="submit" className="w-100" disabled={submitting || step.expired || retry > 0}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('auth.verify.verifying') : t('auth.verify.submit')}
        </Button>
        <OtpResendArea expired={step.expired} remaining={step.resendRemaining} onResend={handleResend} disabled={step.sending || retry > 0} />
        <p className="text-center small mt-2 mb-0">
          <Trans i18nKey="auth.otp.notYou" components={{ 1: <Button variant="link" type="button" className="p-0 align-baseline" onClick={startAgain} /> }} />
        </p>
      </Form>
    </AuthPage>
  )
}
