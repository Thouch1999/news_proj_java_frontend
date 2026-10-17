import { useState } from 'react'
import { Button, Card, Form } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import { CREATABLE_ROLES } from '../../constants/roles'
import { adminUserPath, ROUTES } from '../../constants/routes'
import * as userService from '../../services/userService'
import { blankToNull, hasErrors, rules } from '../../utils/validators'

export default function UserCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    role: CREATABLE_ROLES[0],
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = {
      username: rules.username(form.username),
      fullName: rules.fullName(form.fullName),
      email: rules.email(form.email),
      phone: rules.phone(form.phone),
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
      const created = await userService.createUser({
        username: form.username.trim(),
        fullName: blankToNull(form.fullName),
        email: form.email.trim().toLowerCase(),
        phone: blankToNull(form.phone),
        address: blankToNull(form.address),
        role: form.role,
        password: form.password,
        confirm: form.confirm,
      })
      navigate(adminUserPath(created.id), { state: { message: 'User created. The account is active and email-verified.' } })
    } catch (error) {
      setApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="h4 mb-3">Create user</h1>
      <Card body>
        <Form onSubmit={handleSubmit} noValidate>
          <ErrorAlert error={apiError} />
          <FormField id="username" label="Username" value={form.username} onChange={update('username')} error={errors.username} />
          <FormField id="fullName" label="Full name (optional)" value={form.fullName} onChange={update('fullName')} error={errors.fullName} />
          <FormField id="email" label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} />
          <Form.Group className="mb-3" controlId="role">
            <Form.Label>Role</Form.Label>
            <Form.Select value={form.role} onChange={update('role')}>
              {CREATABLE_ROLES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">Only author and editor accounts can be created here.</Form.Text>
          </Form.Group>
          <FormField id="phone" label="Phone (optional)" value={form.phone} onChange={update('phone')} error={errors.phone} />
          <FormField id="address" label="Address (optional)" value={form.address} onChange={update('address')} />
          <FormField id="password" label="Password" type="password" value={form.password} onChange={update('password')} error={errors.password} help="At least 8 characters" autoComplete="new-password" />
          <FormField id="confirm" label="Confirm password" type="password" value={form.confirm} onChange={update('confirm')} error={errors.confirm} autoComplete="new-password" />
          <div className="d-flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create user'}
            </Button>
            <Button as={Link} to={ROUTES.ADMIN_USERS} variant="outline-secondary">
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
