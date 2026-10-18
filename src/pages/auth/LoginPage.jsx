import { useRef, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/common/AuthPage'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import PasswordInput from '../../components/form/PasswordInput'
import OtpInput from '../../components/form/OtpInput'
import ResendButton from '../../components/form/ResendButton'
import { EMAIL_NOT_VERIFIED_MESSAGE, OTP_LENGTH, RESEND_COOLDOWN_SECONDS } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useCountdown } from '../../hooks/useCountdown'
import { useSettings } from '../../hooks/useSettings'
import * as authService from '../../services/authService'
import { postLoginPath } from '../../utils/postLoginPath'
import { maskEmail } from '../../utils/text'
import { rules } from '../../utils/validators'

export default function LoginPage() {
  const { t } = useTranslation()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, setSession } = useAuth()
  const countdown = useCountdown()
  const { siteName } = useSettings()
  const passwordRef = useRef(null)
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
      setForm((current) => ({ ...current, password: '' }))
      passwordRef.current?.focus()
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
      setNotice('auth.notices.codeResent')
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
      <AuthPage
        title={t('auth.login.otpTitle')}
        description={t('auth.otp.sentTo', { length: OTP_LENGTH, email: maskEmail(email) })}
        secondary={<Trans i18nKey="auth.otp.notYou" components={{ 1: <Button variant="link" type="button" className="p-0 align-baseline" onClick={backToCredentials} /> }} />}
      >
        <Form onSubmit={handleOtp} noValidate>
          <ErrorAlert error={apiError} />
          {notice && <Alert variant="info">{t(notice)}</Alert>}
          <OtpInput value={otp} onChange={setOtp} invalid={Boolean(errors.otp)} describedBy="otp-error" disabled={submitting} autoFocus />
          {errors.otp && (
            <div id="otp-error" className="text-danger text-center small mb-2">
              {errors.otp}
            </div>
          )}
          <Button type="submit" className="w-100" disabled={submitting}>
            {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
            {submitting ? t('auth.login.verifying') : t('auth.otp.verify')}
          </Button>
          <div className="text-center mt-2">
            <ResendButton remaining={countdown.remaining} onClick={handleResend} />
          </div>
        </Form>
      </AuthPage>
    )
  }

  return (
    <AuthPage
      title={t('auth.login.heading', { site: siteName })}
      description={t('auth.login.description')}
      notice={state?.message && <Alert variant={state.variant ?? 'info'}>{state.message}</Alert>}
      secondary={<Trans i18nKey="auth.login.newTo" values={{ site: siteName }} components={{ 1: <Link to={ROUTES.REGISTER} /> }} />}
    >
      <Form onSubmit={handleCredentials} noValidate>
        <ErrorAlert error={apiError} />
        {needsVerification && (
          <Alert variant="warning">
            {t('auth.emailNotVerified')}{' '}
            <Link to={ROUTES.VERIFY_EMAIL} state={{ email }}>
              {t('auth.login.goToVerify')}
            </Link>
          </Alert>
        )}
        <FormField id="email" label={t('auth.fields.email')} type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="username" autoFocus />
        <PasswordInput
          id="password"
          label={t('auth.fields.password')}
          value={form.password}
          error={errors.password}
          autoComplete="current-password"
          warnCapsLock
          inputRef={passwordRef}
          labelAction={<Link to={ROUTES.FORGOT_PASSWORD} className="small">{t('auth.login.forgot')}</Link>}
          onChange={(value) => setForm((current) => ({ ...current, password: value }))}
        />
        <Button type="submit" className="w-100" disabled={submitting}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('auth.login.loggingIn') : t('auth.login.submit')}
        </Button>
      </Form>
    </AuthPage>
  )
}
