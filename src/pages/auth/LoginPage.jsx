import { useRef, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/common/AuthPage'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import PasswordInput from '../../components/form/PasswordInput'
import { EMAIL_NOT_VERIFIED_MESSAGE, OTP_PURPOSE } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useRetryAfter } from '../../hooks/useRetryAfter'
import { useSettings } from '../../hooks/useSettings'
import * as authService from '../../services/authService'
import { savePending } from '../../utils/pendingVerification'
import { postLoginPath } from '../../utils/postLoginPath'
import { rules } from '../../utils/validators'
import LoginCodeStep from './LoginCodeStep'

export default function LoginPage() {
  const { t } = useTranslation()
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, setSession } = useAuth()
  const { siteName } = useSettings()
  const passwordRef = useRef(null)
  const from = state?.from

  const [form, setForm] = useState({ email: state?.email ?? '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // too many failed attempts: the button waits for the countdown of the error, then works again by itself
  const retry = useRetryAfter(apiError)
  const blocked = retry > 0

  if (isAuthenticated) {
    return <Navigate to={postLoginPath(user, from)} replace />
  }

  // staff accounts then get the code step on its own route, so a refresh stays on it
  if (pathname === ROUTES.LOGIN_VERIFY) {
    return <LoginCodeStep password={form.password} from={from} />
  }

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const email = form.email.trim().toLowerCase()

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
      const result = await authService.login({ email, password: form.password })
      if (result.otpRequired) {
        savePending({ purpose: OTP_PURPOSE.LOGIN, email }) // email and times only: never the password
        navigate(ROUTES.LOGIN_VERIFY, { state: from ? { from } : null })
      } else {
        setSession(result)
        navigate(postLoginPath(result.user, from), { replace: true })
      }
    } catch (error) {
      setApiError(error)
      setForm((current) => ({ ...current, password: '' }))
      passwordRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  // staff must verify the email before they can log in (readers can log in without it)
  const needsVerification = apiError?.code === 403 && apiError.message === EMAIL_NOT_VERIFIED_MESSAGE

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
        <Button type="submit" className="w-100" disabled={submitting || blocked}>
          {submitting && <Spinner size="sm" className="me-2" aria-hidden="true" />}
          {submitting ? t('auth.login.loggingIn') : t('auth.login.submit')}
        </Button>
      </Form>
    </AuthPage>
  )
}
