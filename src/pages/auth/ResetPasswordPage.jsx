import { useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/common/AuthPage'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import PasswordFields from '../../components/form/PasswordFields'
import OtpInput from '../../components/form/OtpInput'
import ResendButton from '../../components/form/ResendButton'
import { OTP_PURPOSE, RESEND_COOLDOWN_SECONDS } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import { useCountdown } from '../../hooks/useCountdown'
import { useRetryAfter } from '../../hooks/useRetryAfter'
import * as authService from '../../services/authService'
import { hasErrors, rules } from '../../utils/validators'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  const countdown = useCountdown()

  const [form, setForm] = useState({ email: state?.email ?? '', password: '', confirm: '' })
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const retry = useRetryAfter(apiError)
  const [notice, setNotice] = useState(state?.noticeKey ?? null)
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
        state: { message: t('auth.reset.success'), variant: 'success' },
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
      setNotice('auth.notices.forgotPassword')
      countdown.start(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      setApiError(error)
    }
  }

  return (
    <AuthPage title={t('auth.reset.title')} description={t('auth.reset.description')} secondary={<Trans i18nKey="auth.secondary.remembered" components={{ 1: <Link to={ROUTES.LOGIN} /> }} />}>
      <Form onSubmit={handleSubmit} noValidate>
        {notice && <Alert variant="info">{t(notice)}</Alert>}
        <ErrorAlert error={apiError} />
        <FormField id="email" label={t('auth.fields.email')} type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="email" />
        <Form.Label className="d-block text-center">{t('auth.fields.verificationCode')}</Form.Label>
        <OtpInput value={otp} onChange={setOtp} invalid={Boolean(errors.otp)} describedBy="otp-error" disabled={submitting} />
        {errors.otp && (
          <div id="otp-error" className="text-danger text-center small mb-2">
            {errors.otp}
          </div>
        )}
        <PasswordFields
          idPrefix="reset"
          generator={false}
          compact
          value={{ password: form.password, confirm: form.confirm }}
          errors={errors}
          labels={{ password: t('auth.fields.newPassword'), confirm: t('auth.fields.confirmNewPassword') }}
          onChange={(value) => setForm((current) => ({ ...current, ...value }))}
        />
        <Button type="submit" className="w-100" disabled={submitting || retry > 0}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('auth.reset.resetting') : t('auth.reset.submit')}
        </Button>
        <div className="text-center mt-2">
          <ResendButton remaining={countdown.remaining} onClick={handleResend} disabled={retry > 0} />
        </div>
      </Form>
    </AuthPage>
  )
}
