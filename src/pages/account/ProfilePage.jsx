import { useState } from 'react'
import { Alert, Badge, Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import ErrorAlert from '../../components/common/ErrorAlert'
import FormField from '../../components/form/FormField'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import * as authService from '../../services/authService'
import * as userService from '../../services/userService'
import { blankToNull, hasErrors, rules } from '../../utils/validators'

function ProfileForm({ user, onSaved }) {
  const [form, setForm] = useState({
    username: user.username ?? '',
    fullName: user.fullName ?? '',
    address: user.address ?? '',
    phone: user.phone ?? '',
    avatar: user.avatar ?? '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = {
      username: rules.username(form.username),
      fullName: rules.fullName(form.fullName),
      phone: rules.phone(form.phone),
      avatar: rules.avatar(form.avatar),
    }
    setErrors(found)
    setApiError(null)
    setSaved(false)
    if (hasErrors(found)) {
      return
    }
    setSubmitting(true)
    try {
      const updated = await userService.updateMe({
        username: form.username.trim(),
        fullName: blankToNull(form.fullName),
        address: blankToNull(form.address),
        phone: blankToNull(form.phone),
        avatar: blankToNull(form.avatar),
      })
      onSaved(updated)
      setSaved(true)
    } catch (error) {
      setApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <ErrorAlert error={apiError} />
      {saved && <Alert variant="success">Profile updated.</Alert>}
      <FormField id="profile-username" label="Username" value={form.username} onChange={update('username')} error={errors.username} />
      <FormField id="profile-fullName" label="Full name" value={form.fullName} onChange={update('fullName')} error={errors.fullName} />
      <FormField id="profile-avatar" label="Avatar (image URL)" value={form.avatar} onChange={update('avatar')} error={errors.avatar} />
      {form.avatar.trim() && !errors.avatar && (
        <img src={form.avatar.trim()} alt="Avatar preview" width="64" height="64" className="rounded-circle mb-3 object-fit-cover" />
      )}
      <FormField id="profile-phone" label="Phone (optional)" value={form.phone} onChange={update('phone')} error={errors.phone} />
      <FormField id="profile-address" label="Address (optional)" value={form.address} onChange={update('address')} error={errors.address} />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save profile'}
      </Button>
    </Form>
  )
}

function ChangePasswordForm() {
  const empty = { currentPassword: '', password: '', confirm: '' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = {
      currentPassword: rules.required('Current password')(form.currentPassword),
      password: rules.password(form.password),
      confirm: rules.confirm(form.password, form.confirm),
    }
    setErrors(found)
    setApiError(null)
    setSaved(false)
    if (hasErrors(found)) {
      return
    }
    setSubmitting(true)
    try {
      await authService.changePassword(form)
      setForm(empty)
      setSaved(true)
    } catch (error) {
      setApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <ErrorAlert error={apiError} />
      {saved && <Alert variant="success">Password changed.</Alert>}
      <FormField id="current-password" label="Current password" type="password" value={form.currentPassword} onChange={update('currentPassword')} error={errors.currentPassword} autoComplete="current-password" />
      <FormField id="new-password" label="New password" type="password" value={form.password} onChange={update('password')} error={errors.password} help="At least 8 characters" autoComplete="new-password" />
      <FormField id="confirm-new-password" label="Confirm new password" type="password" value={form.confirm} onChange={update('confirm')} error={errors.confirm} autoComplete="new-password" />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Changing...' : 'Change password'}
      </Button>
    </Form>
  )
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  return (
    <div className="mx-auto" style={{ maxWidth: 720 }}>
      <h1 className="h3 mb-3">My profile</h1>
      <p className="text-muted">
        {user.email} <Badge bg="secondary">{user.role}</Badge>{' '}
        {user.emailVerified ? <Badge bg="success">Email verified</Badge> : <Badge bg="warning" text="dark">Email not verified</Badge>}
      </p>
      {!user.emailVerified && (
        <Alert variant="warning">
          Your email is not verified yet.{' '}
          <Link to={ROUTES.VERIFY_EMAIL} state={{ email: user.email }}>
            Verify your email
          </Link>
        </Alert>
      )}
      <Row className="g-4">
        <Col md={7}>
          <Card body>
            <h2 className="h5 mb-3">Profile</h2>
            <ProfileForm user={user} onSaved={updateUser} />
          </Card>
        </Col>
        <Col md={5}>
          <Card body>
            <h2 className="h5 mb-3">Change password</h2>
            <ChangePasswordForm />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
