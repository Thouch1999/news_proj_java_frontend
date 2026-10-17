import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import { ROUTES } from '../../constants/routes'
import * as authService from '../../services/authService'
import { blankToNull, hasErrors, rules } from '../../utils/validators'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', fullName: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = {
      username: rules.username(form.username),
      email: rules.email(form.email),
      fullName: rules.fullName(form.fullName),
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
      const email = form.email.trim().toLowerCase()
      await authService.register({
        username: form.username.trim(),
        email,
        fullName: blankToNull(form.fullName),
        password: form.password,
        confirm: form.confirm,
      })
      // a verification code was just emailed, so the resend countdown starts right away
      navigate(ROUTES.VERIFY_EMAIL, { state: { email, justSent: true } })
    } catch (error) {
      setApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <h1 className="h4 mb-3">Create an account</h1>
      <ErrorAlert error={apiError} />
      <FormField id="username" label="Username" value={form.username} onChange={update('username')} error={errors.username} autoComplete="username" />
      <FormField id="email" label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="email" />
      <FormField id="fullName" label="Full name (optional)" value={form.fullName} onChange={update('fullName')} error={errors.fullName} autoComplete="name" />
      <FormField id="password" label="Password" type="password" value={form.password} onChange={update('password')} error={errors.password} help="At least 8 characters" autoComplete="new-password" />
      <FormField id="confirm" label="Confirm password" type="password" value={form.confirm} onChange={update('confirm')} error={errors.confirm} autoComplete="new-password" />
      <Button type="submit" className="w-100" disabled={submitting}>
        {submitting ? 'Creating account...' : 'Register'}
      </Button>
      <p className="text-center mt-3 mb-0">
        Already have an account? <Link to={ROUTES.LOGIN}>Log in</Link>
      </p>
    </Form>
  )
}
