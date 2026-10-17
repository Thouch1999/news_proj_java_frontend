import { useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import OtpInput from '../../components/form/OtpInput'
import ResendButton from '../../components/form/ResendButton'
import { FORGOT_PASSWORD_NOTICE, OTP_PURPOSE, RESEND_COOLDOWN_SECONDS } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import { useCountdown } from '../../hooks/useCountdown'
import * as authService from '../../services/authService'
import { hasErrors, rules } from '../../utils/validators'

export default function ResetPasswordPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const countdown = useCountdown()

  const [form, setForm] = useState({ email: state?.email ?? '', password: '', confirm: '' })
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [notice, setNotice] = useState(state?.notice ?? null)
  const [submitting, setSubmitting] = useState(false)

  // arriving from "forgot password": the code was just requested, so the countdown starts right away
  const [started, setStarted] = useState(false)
  if (state?.cooldown && !started) {
    setStarted(true)
    countdown.start(state.cooldown)
  }

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = {
      email: rules.email(form.email),
      otp: rules.otp(otp),
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
      await authService.resetPassword({
        email: form.email.trim().toLowerCase(),
        otp,
        password: form.password,
        confirm: form.confirm,
      })
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { message: 'Your password has been reset. Please log in with the new password.', variant: 'success' },
      })
    } catch (error) {
      setApiError(error)
      setOtp('')
    } finally {
      setSubmitting(false)
    }
  }

  // forgot-password answers the same for any email, so resend does too
  const handleResend = async () => {
    const emailError = rules.email(form.email)
    setErrors({ email: emailError })
    setApiError(null)
    if (emailError) {
      return
    }
    try {
      await authService.resendOtp({ email: form.email.trim().toLowerCase(), purpose: OTP_PURPOSE.RESET_PASSWORD })
      setNotice(FORGOT_PASSWORD_NOTICE)
      countdown.start(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      setApiError(error)
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <h1 className="h4 mb-3">Reset password</h1>
      {notice && <Alert variant="info">{notice}</Alert>}
      <ErrorAlert error={apiError} />
      <FormField id="email" label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="email" />
      <Form.Label className="d-block text-center">Verification code</Form.Label>
      <OtpInput value={otp} onChange={setOtp} invalid={Boolean(errors.otp)} disabled={submitting} />
      {errors.otp && <div className="text-danger text-center small mb-2">{errors.otp}</div>}
      <FormField id="password" label="New password" type="password" value={form.password} onChange={update('password')} error={errors.password} help="At least 8 characters" autoComplete="new-password" />
      <FormField id="confirm" label="Confirm new password" type="password" value={form.confirm} onChange={update('confirm')} error={errors.confirm} autoComplete="new-password" />
      <Button type="submit" className="w-100" disabled={submitting}>
        {submitting ? 'Resetting...' : 'Reset password'}
      </Button>
      <div className="d-flex justify-content-between align-items-center mt-2">
        <ResendButton remaining={countdown.remaining} onClick={handleResend} />
        <Link to={ROUTES.LOGIN}>Back to log in</Link>
      </div>
    </Form>
  )
}
