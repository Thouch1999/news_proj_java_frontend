import { useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import OtpInput from '../../components/form/OtpInput'
import ResendButton from '../../components/form/ResendButton'
import { OTP_PURPOSE, RESEND_COOLDOWN_SECONDS } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useCountdown } from '../../hooks/useCountdown'
import * as authService from '../../services/authService'
import { rules } from '../../utils/validators'

export default function VerifyEmailPage() {
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
          state: { message: 'Your email has been verified. Please log in.', variant: 'success' },
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
      setNotice('A new code has been sent if this email is waiting for verification.')
      countdown.start(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      setApiError(error)
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <h1 className="h4 mb-3">Verify your email</h1>
      <p className="text-muted">Enter the 6-digit code we sent to your email address.</p>
      <ErrorAlert error={apiError} />
      {notice && <Alert variant="info">{notice}</Alert>}
      {!state?.email && (
        <FormField id="email" label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} />
      )}
      {state?.email && <p className="text-center fw-semibold">{email}</p>}
      <OtpInput value={otp} onChange={setOtp} invalid={Boolean(errors.otp)} disabled={submitting} />
      {errors.otp && <div className="text-danger text-center small mb-2">{errors.otp}</div>}
      <Button type="submit" className="w-100" disabled={submitting}>
        {submitting ? 'Verifying...' : 'Verify email'}
      </Button>
      <div className="d-flex justify-content-between align-items-center mt-2">
        <ResendButton remaining={countdown.remaining} onClick={handleResend} />
        <Link to={ROUTES.LOGIN}>Back to log in</Link>
      </div>
    </Form>
  )
}
