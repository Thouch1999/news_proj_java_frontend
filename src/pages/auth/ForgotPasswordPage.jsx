import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import { FORGOT_PASSWORD_NOTICE, RESEND_COOLDOWN_SECONDS } from '../../constants/otp'
import { ROUTES } from '../../constants/routes'
import * as authService from '../../services/authService'
import { rules } from '../../utils/validators'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = rules.email(email)
    setError(found)
    setApiError(null)
    if (found) {
      return
    }
    setSubmitting(true)
    try {
      const normalized = email.trim().toLowerCase()
      await authService.forgotPassword({ email: normalized })
      navigate(ROUTES.RESET_PASSWORD, {
        state: { email: normalized, notice: FORGOT_PASSWORD_NOTICE, cooldown: RESEND_COOLDOWN_SECONDS },
      })
    } catch (caught) {
      setApiError(caught)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <h1 className="h4 mb-3">Forgot password</h1>
      <p className="text-muted">Enter your email and we will send you a code to reset your password.</p>
      <ErrorAlert error={apiError} />
      <FormField id="email" label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={error} autoComplete="email" />
      <Button type="submit" className="w-100" disabled={submitting}>
        {submitting ? 'Sending...' : 'Send code'}
      </Button>
      <p className="text-center mt-3 mb-0">
        <Link to={ROUTES.LOGIN}>Back to log in</Link>
      </p>
    </Form>
  )
}
