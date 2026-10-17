import { useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import OtpInput from '../../components/form/OtpInput'
import ResendButton from '../../components/form/ResendButton'
import { EMAIL_NOT_VERIFIED_MESSAGE, RESEND_COOLDOWN_SECONDS } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useCountdown } from '../../hooks/useCountdown'
import * as authService from '../../services/authService'
import { postLoginPath } from '../../utils/postLoginPath'
import { rules } from '../../utils/validators'

export default function LoginPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, setSession } = useAuth()
  const countdown = useCountdown()
  const from = state?.from

  // 'credentials' first; staff accounts then get the 'otp' step
  const [step, setStep] = useState('credentials')
  const [form, setForm] = useState({ email: '', password: '' })
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={postLoginPath(user, from)} replace />
  }

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const email = form.email.trim().toLowerCase()

  const finish = (result) => {
    setSession(result)
    navigate(postLoginPath(result.user, from), { replace: true })
  }

  // used by the first step and by "resend code": the backend re-checks the password and sends a new LOGIN code
  const requestLogin = async () => {
    const result = await authService.login({ email, password: form.password })
    if (result.otpRequired) {
      setStep('otp')
      setOtp('')
      countdown.start(RESEND_COOLDOWN_SECONDS)
    } else {
      finish(result)
    }
  }

  const handleCredentials = async (event) => {
    event.preventDefault()
    const found = { email: rules.email(form.email), password: rules.password(form.password) }
    setErrors(found)
    setApiError(null)
    if (found.email || found.password) {
      return
    }
    setSubmitting(true)
    try {
      await requestLogin()
    } catch (error) {
      setApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOtp = async (event) => {
    event.preventDefault()
    const found = { otp: rules.otp(otp) }
    setErrors(found)
    setApiError(null)
    setNotice(null)
    if (found.otp) {
      return
    }
    setSubmitting(true)
    try {
      finish(await authService.verifyLoginOtp({ email, otp }))
    } catch (error) {
      setApiError(error)
      setOtp('')
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setApiError(null)
    setNotice(null)
    try {
      await requestLogin()
      setNotice('A new code has been sent to your email.')
    } catch (error) {
      setApiError(error)
    }
  }

  const backToCredentials = () => {
    setStep('credentials')
    setOtp('')
    setErrors({})
    setApiError(null)
    setNotice(null)
  }

  // staff must verify the email before they can log in (readers can log in without it)
  const needsVerification = apiError?.code === 403 && apiError.message === EMAIL_NOT_VERIFIED_MESSAGE

  if (step === 'otp') {
    return (
      <Form onSubmit={handleOtp} noValidate>
        <h1 className="h4 mb-3">Enter your login code</h1>
        <p className="text-muted">We sent a 6-digit code to {email}.</p>
        <ErrorAlert error={apiError} />
        {notice && <Alert variant="info">{notice}</Alert>}
        <OtpInput value={otp} onChange={setOtp} invalid={Boolean(errors.otp)} disabled={submitting} />
        {errors.otp && <div className="text-danger text-center small mb-2">{errors.otp}</div>}
        <Button type="submit" className="w-100" disabled={submitting}>
          {submitting ? 'Verifying...' : 'Verify and log in'}
        </Button>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <ResendButton remaining={countdown.remaining} onClick={handleResend} />
          <Button variant="link" type="button" onClick={backToCredentials}>
            Back
          </Button>
        </div>
      </Form>
    )
  }

  return (
    <Form onSubmit={handleCredentials} noValidate>
      <h1 className="h4 mb-3">Log in</h1>
      {state?.message && <Alert variant={state.variant ?? 'warning'}>{state.message}</Alert>}
      <ErrorAlert error={apiError} />
      {needsVerification && (
        <Alert variant="warning">
          Your email is not verified yet.{' '}
          <Link to={ROUTES.VERIFY_EMAIL} state={{ email }}>
            Go to Verify Email
          </Link>
        </Alert>
      )}
      <FormField id="email" label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="email" />
      <FormField id="password" label="Password" type="password" value={form.password} onChange={update('password')} error={errors.password} autoComplete="current-password" />
      <Button type="submit" className="w-100" disabled={submitting}>
        {submitting ? 'Logging in...' : 'Log in'}
      </Button>
      <div className="d-flex justify-content-between mt-3">
        <Link to={ROUTES.FORGOT_PASSWORD}>Forgot password?</Link>
        <Link to={ROUTES.REGISTER}>Create an account</Link>
      </div>
    </Form>
  )
}
