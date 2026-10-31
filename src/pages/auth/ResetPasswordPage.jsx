import { useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/common/AuthPage'
import ErrorAlert from '../../components/common/ErrorAlert'
import PasswordFields from '../../components/form/PasswordFields'
import OtpInput from '../../components/form/OtpInput'
import OtpResendArea from '../../components/form/OtpResendArea'
import PendingGate from '../../components/form/PendingGate'
import { OTP_LENGTH, OTP_PURPOSE } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import { usePendingVerification } from '../../hooks/usePendingVerification'
import { useRetryAfter } from '../../hooks/useRetryAfter'
import * as authService from '../../services/authService'
import { hasErrors, rules } from '../../utils/validators'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  // forgot-password answers the same for any email, so resend does too
  const step = usePendingVerification({
    purpose: OTP_PURPOSE.RESET_PASSWORD,
    startPath: ROUTES.FORGOT_PASSWORD,
    send: (email) => authService.resendOtp({ email, purpose: OTP_PURPOSE.RESET_PASSWORD }),
  })

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const retry = useRetryAfter(apiError)
  const [submitting, setSubmitting] = useState(false)

  if (step.gate) {
    return <PendingGate gate={step.gate} />
  }
  const { pending } = step
  const notice = step.notice ?? (state?.noticeKey ? t(state.noticeKey) : null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = {
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
      await authService.resetPassword({ email: pending.email, otp, password: form.password, confirm: form.confirm })
      step.clear()
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
    navigate(ROUTES.FORGOT_PASSWORD)
  }

  return (
    <AuthPage
      title={t('auth.reset.title')}
      description={t('auth.otp.sentTo', { length: OTP_LENGTH, email: pending.maskedEmail })}
      secondary={<Trans i18nKey="auth.secondary.remembered" components={{ 1: <Link to={ROUTES.LOGIN} onClick={step.clear} /> }} />}
    >
      <Form onSubmit={handleSubmit} noValidate>
        {notice && <Alert variant="info">{notice}</Alert>}
        <ErrorAlert error={apiError} />
        <Form.Label className="d-block text-center">{t('auth.fields.verificationCode')}</Form.Label>
        <OtpInput value={otp} onChange={setOtp} invalid={Boolean(errors.otp)} describedBy="otp-error" disabled={submitting || step.expired} autoFocus focusSignal={step.focusSignal} />
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
        <Button type="submit" className="w-100" disabled={submitting || step.expired || retry > 0}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('auth.reset.resetting') : t('auth.reset.submit')}
        </Button>
        <OtpResendArea expired={step.expired} remaining={step.resendRemaining} onResend={handleResend} disabled={step.sending || retry > 0} />
        <p className="text-center small mt-2 mb-0">
          <Trans i18nKey="auth.otp.notYou" components={{ 1: <Button variant="link" type="button" className="p-0 align-baseline" onClick={startAgain} /> }} />
        </p>
      </Form>
    </AuthPage>
  )
}
