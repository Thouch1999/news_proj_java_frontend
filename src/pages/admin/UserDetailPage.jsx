import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Link, useLocation, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ErrorAlert from '../../components/common/ErrorAlert'
import PageSpinner from '../../components/common/PageSpinner'
import FormField from '../../components/form/FormField'
import { ROLE_VARIANT, ROLES } from '../../constants/roles'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import * as userService from '../../services/userService'
import { hasErrors, rules } from '../../utils/validators'

function ResetPasswordDialog({ show, username, busy, onConfirm, onCancel }) {
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = () => {
    const found = {
      password: rules.password(form.password),
      confirm: rules.confirm(form.password, form.confirm),
    }
    setErrors(found)
    if (!hasErrors(found)) {
      onConfirm(form)
    }
  }

  return (
    <ConfirmDialog show={show} title="Reset password" confirmLabel="Reset password" confirmVariant="danger" busy={busy} onConfirm={submit} onCancel={onCancel}>
      <p>
        Set a new password for <strong>{username}</strong>. Their refresh tokens are revoked, so they have to log in again.
      </p>
      <FormField id="reset-password" label="New password" type="password" value={form.password} onChange={update('password')} error={errors.password} help="At least 8 characters" autoComplete="new-password" />
      <FormField id="reset-confirm" label="Confirm new password" type="password" value={form.confirm} onChange={update('confirm')} error={errors.confirm} autoComplete="new-password" />
    </ConfirmDialog>
  )
}

export default function UserDetailPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const { user: me } = useAuth()

  // `loaded` holds the result for one user id; the page is loading until it matches the id in the URL
  const [loaded, setLoaded] = useState({ id: null, user: null, error: null })
  const [role, setRole] = useState('')
  const loading = loaded.id !== id
  const user = loaded.user
  const loadError = loaded.error
  const [actionError, setActionError] = useState(null)
  const [message, setMessage] = useState(state?.message ?? null)
  const [dialog, setDialog] = useState(null) // 'status' | 'role' | 'password' | null
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let current = true
    userService
      .getUser(id)
      .then((data) => {
        if (current) {
          setLoaded({ id, user: data, error: null })
          setRole(data.role)
        }
      })
      .catch((caught) => {
        if (current) setLoaded({ id, user: null, error: caught })
      })
    return () => {
      current = false
    }
  }, [id])

  // runs one admin action; backend errors (including the self-protection rules) are shown as they come
  const run = async (action, successMessage) => {
    setBusy(true)
    setActionError(null)
    setMessage(null)
    try {
      const updated = await action()
      if (updated) {
        setLoaded((previous) => ({ ...previous, user: updated }))
        setRole(updated.role)
      }
      setMessage(successMessage)
    } catch (error) {
      setActionError(error)
    } finally {
      setBusy(false)
      setDialog(null)
    }
  }

  if (loading) {
    return <PageSpinner />
  }
  if (loadError || !user) {
    return (
      <div>
        <ErrorAlert error={loadError} />
        <Link to={ROUTES.ADMIN_USERS}>Back to users</Link>
      </div>
    )
  }

  const isSelf = me?.id === user.id
  const roleChanged = role !== user.role

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="mb-3">
        <Link to={ROUTES.ADMIN_USERS}>&larr; Back to users</Link>
      </div>
      <h1 className="h4 mb-3">
        {user.username} {isSelf && <Badge bg="dark">You</Badge>}
      </h1>
      {message && <Alert variant="success">{message}</Alert>}
      <ErrorAlert error={actionError} />

      <Row className="g-3">
        <Col md={6}>
          <Card body>
            <h2 className="h6 mb-3">Information</h2>
            <dl className="row mb-0">
              <dt className="col-sm-4">ID</dt>
              <dd className="col-sm-8">{user.id}</dd>
              <dt className="col-sm-4">Username</dt>
              <dd className="col-sm-8">{user.username}</dd>
              <dt className="col-sm-4">Full name</dt>
              <dd className="col-sm-8">{user.fullName || '-'}</dd>
              <dt className="col-sm-4">Email</dt>
              <dd className="col-sm-8">{user.email}</dd>
              <dt className="col-sm-4">Phone</dt>
              <dd className="col-sm-8">{user.phone || '-'}</dd>
              <dt className="col-sm-4">Address</dt>
              <dd className="col-sm-8">{user.address || '-'}</dd>
              <dt className="col-sm-4">Role</dt>
              <dd className="col-sm-8">
                <Badge bg={ROLE_VARIANT[user.role] ?? 'secondary'}>{user.role}</Badge>
              </dd>
              <dt className="col-sm-4">Status</dt>
              <dd className="col-sm-8">{user.active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</dd>
              <dt className="col-sm-4">Email</dt>
              <dd className="col-sm-8">{user.emailVerified ? <Badge bg="success">Verified</Badge> : <Badge bg="warning" text="dark">Not verified</Badge>}</dd>
            </dl>
          </Card>
        </Col>

        <Col md={6}>
          <Card body className="mb-3">
            <h2 className="h6 mb-3">Status</h2>
            {user.active ? (
              <>
                <Button variant="outline-danger" disabled={isSelf || busy} onClick={() => setDialog('status')}>
                  Deactivate user
                </Button>
                {isSelf && <div className="form-text">You cannot deactivate your own account.</div>}
              </>
            ) : (
              <Button variant="outline-success" disabled={busy} onClick={() => setDialog('status')}>
                Activate user
              </Button>
            )}
          </Card>

          <Card body className="mb-3">
            <h2 className="h6 mb-3">Role</h2>
            <Form.Select aria-label="Role" value={role} onChange={(event) => setRole(event.target.value)} disabled={isSelf || busy}>
              {Object.values(ROLES).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Form.Select>
            {isSelf ? (
              <div className="form-text">You cannot remove your own ADMIN role.</div>
            ) : (
              <div className="form-text">A user has exactly one role; choosing another replaces it.</div>
            )}
            <Button className="mt-2" disabled={isSelf || !roleChanged || busy} onClick={() => setDialog('role')}>
              Change role
            </Button>
          </Card>

          <Card body>
            <h2 className="h6 mb-3">Password</h2>
            <Button variant="outline-secondary" disabled={busy} onClick={() => setDialog('password')}>
              Reset password
            </Button>
          </Card>
        </Col>
      </Row>

      <ConfirmDialog
        show={dialog === 'status'}
        title={user.active ? 'Deactivate user' : 'Activate user'}
        confirmLabel={user.active ? 'Deactivate' : 'Activate'}
        confirmVariant={user.active ? 'danger' : 'success'}
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() =>
          user.active
            ? run(() => userService.deactivateUser(user.id), 'User deactivated.')
            : run(() => userService.activateUser(user.id), 'User activated.')
        }
      >
        {user.active
          ? `${user.username} will no longer be able to use the site, and their sessions are ended.`
          : `${user.username} will be able to log in again.`}
      </ConfirmDialog>

      <ConfirmDialog
        show={dialog === 'role'}
        title="Change role"
        confirmLabel="Change role"
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(() => userService.changeUserRole(user.id, role), 'Role changed.')}
      >
        Change the role of <strong>{user.username}</strong> from <strong>{user.role}</strong> to <strong>{role}</strong>?
      </ConfirmDialog>

      {dialog === 'password' && (
        <ResetPasswordDialog
          show
          username={user.username}
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(form) => run(() => userService.resetUserPassword(user.id, form), 'Password reset.')}
        />
      )}
    </div>
  )
}
